"use client";

import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2, Mic, MicOff, Database, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
  csvData?: any[];
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI assistant with direct access to your parts catalog and customer database. I can help you with:\n\n• Finding part numbers and equipment specs from uploaded manuals\n• Generating customer lists for marketing campaigns\n• Creating downloadable CSV reports\n• Answering warranty and service history questions\n• Searching work orders and equipment data\n• Building targeted export lists by tags or equipment type\n\nYou can type or use voice input by clicking the microphone button. Just ask me anything!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [knowledgeCount, setKnowledgeCount] = useState(0);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    loadKnowledgeCount();

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        toast({
          title: "Voice Input Error",
          description: "Could not capture voice. Please try again.",
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const loadKnowledgeCount = async () => {
    const { count } = await supabase
      .from("ai_knowledge_documents")
      .select("*", { count: "exact", head: true });
    setKnowledgeCount(count || 0);
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => JSON.stringify(row[header] || "")).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const { data: knowledgeDocs } = await supabase
        .from("ai_knowledge_documents")
        .select("*");

      const knowledgeContext =
        knowledgeDocs && knowledgeDocs.length > 0
          ? knowledgeDocs.map((doc) => `${doc.title}: ${doc.content}`).join("\n\n")
          : "";

      const conversationHistory = messages.slice(1).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      console.log('Preparing to call AI API...');
      console.log('API URL:', '/api/ai/ask');
      console.log('Request body size:', JSON.stringify({
        question: userMessage,
        knowledgeContext,
        conversationHistory,
      }).length);

      let response;
      try {
        console.log('Making fetch request...');
        response = await fetch("/api/ai/ask", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: userMessage,
            knowledgeContext: knowledgeContext,
            conversationHistory,
          }),
        });
        console.log('Fetch completed, status:', response?.status);
      } catch (fetchError: any) {
        console.error("Fetch error details:", {
          name: fetchError.name,
          message: fetchError.message,
          cause: fetchError.cause,
        });
        throw new Error(`Network error: ${fetchError.message}. The dev server may need to be restarted after adding environment variables.`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      let csvData: any[] | null = null;
      if (data.toolResults) {
        const csvTool = data.toolResults.find(
          (t: any) => t.name === "generate_csv"
        );
        if (csvTool) {
          const parsed = JSON.parse(csvTool.content);
          csvData = parsed.csvData;
        } else {
          const dataTools = data.toolResults.filter((t: any) =>
            ["query_customers", "query_work_orders", "query_warranty_claims", "query_assets", "search_customers_by_tags"].includes(t.name)
          );
          if (dataTools.length > 0) {
            const parsed = JSON.parse(dataTools[0].content);
            if (Array.isArray(parsed)) {
              csvData = parsed;
            }
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "I found the information you requested.",
          csvData: csvData || undefined,
        },
      ]);
    } catch (error: any) {
      console.error("AI Assistant Error:", error);

      let errorMessage = error.message || "An unknown error occurred";

      if (errorMessage.includes("OPENAI_API_KEY") || errorMessage.includes("API key")) {
        errorMessage = "OpenAI API key issue detected. Please check that:\n\n1. You have added a valid OPENAI_API_KEY to your .env file\n2. The key starts with 'sk-' and is complete\n3. You have restarted the dev server after adding the key\n\nGet your key from: https://platform.openai.com/api-keys";
      } else if (errorMessage.includes("Network error") || errorMessage.includes("fetch failed")) {
        errorMessage = "Connection error. Please ensure:\n\n1. The dev server is running\n2. You have an internet connection\n3. The API route is accessible\n\nError: " + error.message;
      }

      toast({
        title: "AI Assistant Error",
        description: errorMessage,
        variant: "destructive",
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Error: ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="border-b p-4 bg-white flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">AI Assistant</h1>
            <p className="text-sm text-gray-600">
              Ask questions about customers, parts, or generate marketing lists
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Database className="h-4 w-4" />
            <span>{knowledgeCount} documents in knowledge base</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <Card
                className={`max-w-[80%] ${msg.role === "user" ? "bg-blue-50" : "bg-white"}`}
              >
                <CardContent className="p-4">
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  {msg.csvData && msg.csvData.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          downloadCSV(
                            msg.csvData!,
                            `export-${Date.now()}.csv`
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV ({msg.csvData.length} records)
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="border-t p-4 bg-white">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleVoiceInput}
              className={isListening ? "bg-red-50 border-red-300" : ""}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-red-600" />
              ) : (
                <Mic className="w-4 w-4" />
              )}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                isListening
                  ? "Listening..."
                  : "Ask about parts, customers, or request marketing lists..."
              }
              disabled={loading || isListening}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim() || isListening}
              size="icon"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Voice input available. Click the microphone to speak your question.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
