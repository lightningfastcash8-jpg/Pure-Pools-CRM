"use client";

import { AppLayout } from "@/components/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Calendar, Settings as SettingsIcon, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Upload, Database, FileText, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [gmailConnected, setGmailConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentType, setDocumentType] = useState("parts_catalog");
  const [knowledgeDocs, setKnowledgeDocs] = useState<any[]>([]);
  const [importYearsBack, setImportYearsBack] = useState(4);
  const [importLoading, setImportLoading] = useState(false);
  const [inputMethod, setInputMethod] = useState<"text" | "url" | "file">("text");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");
    const details = searchParams.get("details");

    if (error) {
      const errorMessages: Record<string, string> = {
        database_error: `Failed to save connection${details ? `: ${details}` : ""}`,
        token_exchange_failed: "Failed to exchange authorization code",
        oauth_not_configured: "Google OAuth is not configured on the server",
        server_config_error: "Server configuration error - missing service role key",
        missing_code: "Missing authorization code from Google",
        unexpected_error: "An unexpected error occurred",
      };
      setOauthError(errorMessages[error] || error);
      toast.error(errorMessages[error] || `Connection failed: ${error}`);
    }

    if (success === "true") {
      toast.success("Google account connected successfully!");
    }
  }, [searchParams]);

  useEffect(() => {
    checkConnections();
    loadKnowledgeDocs();
  }, [user]);

  const checkConnections = async () => {
    if (!user) return;

    const supabase = createClient();

    const { data: tokens } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('provider', 'google')
      .maybeSingle();

    if (tokens) {
      setGmailConnected(true);
      setUserEmail(tokens.email || user.email || "");
    }
  };

  const loadKnowledgeDocs = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("ai_knowledge_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setKnowledgeDocs(data);
    }
  };

  const connectGoogle = async () => {
    if (!user) return;
    setLoading(true);
    try {
      window.location.href = `/api/auth/google?userId=${encodeURIComponent(user.id)}&returnTo=${encodeURIComponent('/settings')}`;
    } catch (error: any) {
      console.error("Failed to connect Google:", error);
      setLoading(false);
    }
  };

  const disconnectGoogle = async () => {
    try {
      const supabase = createClient();

      const { data: tokens } = await supabase
        .from('oauth_tokens')
        .select('access_token')
        .eq('provider', 'google')
        .maybeSingle();

      if (tokens?.access_token) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`, {
          method: 'POST',
        });
      }

      await supabase
        .from('oauth_tokens')
        .delete()
        .eq('provider', 'google');

      setGmailConnected(false);
      setUserEmail("");
      toast.success("Google account disconnected");
    } catch (error) {
      console.error("Error disconnecting Google:", error);
      toast.error("Failed to disconnect Google account");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!documentTitle) {
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const uploadDocument = async () => {
    if (!documentTitle) {
      toast.error("Please provide a title");
      return;
    }

    setUploadLoading(true);
    const supabase = createClient();

    try {
      if (inputMethod === "text") {
        if (!documentContent) {
          toast.error("Please provide content");
          setUploadLoading(false);
          return;
        }
        const { error } = await supabase.from("ai_knowledge_documents").insert({
          doc_type: documentType,
          title: documentTitle,
          content: documentContent,
        });
        if (error) throw error;
        toast.success("Document uploaded to knowledge base");
        setDocumentTitle("");
        setDocumentContent("");
        await loadKnowledgeDocs();
      } else if (inputMethod === "url") {
        if (!documentUrl) {
          toast.error("Please provide a URL");
          setUploadLoading(false);
          return;
        }
        const { error } = await supabase.from("ai_knowledge_documents").insert({
          doc_type: documentType,
          title: documentTitle,
          content: `URL Reference: ${documentUrl}`,
        });
        if (error) throw error;
        toast.success("Document uploaded to knowledge base");
        setDocumentTitle("");
        setDocumentUrl("");
        await loadKnowledgeDocs();
      } else if (inputMethod === "file") {
        if (!selectedFile) {
          toast.error("Please select a file");
          setUploadLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Not authenticated");
          setUploadLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("title", documentTitle);
        formData.append("doc_type", documentType);

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const response = await fetch(
          `${supabaseUrl}/functions/v1/extract-document-text`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: formData,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to process file");
        }

        if (result.chunks > 1) {
          toast.success(
            `Document extracted and split into ${result.chunks} parts (${(result.characters / 1000).toFixed(0)}k characters)`
          );
        } else {
          toast.success("Document extracted and added to knowledge base");
        }

        setDocumentTitle("");
        setSelectedFile(null);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        await loadKnowledgeDocs();
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during upload");
      console.error(error);
    } finally {
      setUploadLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("ai_knowledge_documents")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete document");
    } else {
      toast.success("Document removed");
      loadKnowledgeDocs();
    }
  };

  const startHistoricalImport = async () => {
    setImportLoading(true);
    try {
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - importYearsBack);

      const supabase = createClient();
      const { error } = await supabase.from("historical_import_settings").insert({
        start_date: startDate.toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
        label_filter: "Warranty Work",
        status: "pending",
      });

      if (error) throw error;

      toast.success(
        `Historical import queued. Processing emails from the last ${importYearsBack} years.`
      );
    } catch (error: any) {
      toast.error("Failed to start import: " + error.message);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage integrations, knowledge base, and system configuration
          </p>
        </div>

        {oauthError && (
          <Alert className="mb-6 bg-red-50 text-red-900 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Failed</AlertTitle>
            <AlertDescription>{oauthError}</AlertDescription>
          </Alert>
        )}

        {gmailConnected && (
          <Alert className="mb-6 bg-green-50 text-green-900 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Google Connected</AlertTitle>
            <AlertDescription>
              Connected as {userEmail}. Gmail sync and Calendar integration are active.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Google Account
              </CardTitle>
              <CardDescription>
                Connect your Google account for Gmail sync and Calendar integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-2">
                    {gmailConnected ? (
                      <>
                        <Badge className="bg-green-100 text-green-800 w-fit">
                          Connected
                        </Badge>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Gmail Sync Active
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Calendar Access
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className="w-fit">
                          Not Connected
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Connect to enable automated email parsing
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {gmailConnected ? (
                      <>
                        <Button variant="outline" onClick={disconnectGoogle}>
                          Disconnect
                        </Button>
                        <Button onClick={connectGoogle} disabled={loading}>
                          {loading ? "Connecting..." : "Reconnect"}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={connectGoogle} disabled={loading}>
                        {loading ? "Connecting..." : "Connect Google"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Historical Email Import
              </CardTitle>
              <CardDescription>
                Import past emails to build your customer database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Import emails from the last</Label>
                <div className="flex gap-2 items-center mt-2">
                  <Input
                    type="number"
                    value={importYearsBack}
                    onChange={(e) => setImportYearsBack(parseInt(e.target.value))}
                    min={1}
                    max={10}
                    className="w-20"
                  />
                  <span className="text-sm">years</span>
                </div>
              </div>
              <Button
                onClick={startHistoricalImport}
                disabled={importLoading || !gmailConnected}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {importLoading ? "Starting Import..." : "Start Import"}
              </Button>
              {!gmailConnected && (
                <p className="text-xs text-muted-foreground">
                  Connect Google account first to enable imports
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI Knowledge Base
            </CardTitle>
            <CardDescription>
              Upload parts catalogs, manuals, and notes for the AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label>Document Type</Label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="parts_catalog">Parts Catalog</option>
                    <option value="manual">Equipment Manual</option>
                    <option value="note">Personal Note</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label>Title</Label>
                  <Input
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="e.g., Jandy Heater Parts 2024"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Input Method</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      type="button"
                      variant={inputMethod === "text" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInputMethod("text")}
                    >
                      Paste Text
                    </Button>
                    <Button
                      type="button"
                      variant={inputMethod === "url" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInputMethod("url")}
                    >
                      URL
                    </Button>
                    <Button
                      type="button"
                      variant={inputMethod === "file" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInputMethod("file")}
                    >
                      Upload File
                    </Button>
                  </div>
                </div>

                {inputMethod === "text" && (
                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={documentContent}
                      onChange={(e) => setDocumentContent(e.target.value)}
                      placeholder="Paste parts catalog, model numbers, troubleshooting info, or any knowledge you want the AI to reference..."
                      rows={8}
                      className="mt-1"
                    />
                  </div>
                )}

                {inputMethod === "url" && (
                  <div>
                    <Label>Document URL</Label>
                    <Input
                      value={documentUrl}
                      onChange={(e) => setDocumentUrl(e.target.value)}
                      placeholder="https://example.com/manual.pdf"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Link to online manuals, catalogs, or documentation
                    </p>
                  </div>
                )}

                {inputMethod === "file" && (
                  <div>
                    <Label>Upload File (PDF or TXT)</Label>
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.txt"
                      className="mt-1"
                    />
                    {selectedFile && (
                      <p className="text-xs text-green-600 mt-1">
                        Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Large PDFs are supported. Text is automatically extracted and chunked for the AI.
                    </p>
                  </div>
                )}

                <Button
                  onClick={uploadDocument}
                  className="w-full"
                  disabled={uploadLoading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadLoading ? "Uploading..." : "Upload to Knowledge Base"}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Uploaded Documents ({knowledgeDocs.length})</Label>
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                  {knowledgeDocs.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No documents uploaded yet
                    </p>
                  ) : (
                    knowledgeDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{doc.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {doc.doc_type} -{" "}
                            {new Date(doc.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteDocument(doc.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Schedule Settings
            </CardTitle>
            <CardDescription>
              Configure heater annual service season and daily capacity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>Season: May 15 - September 15</p>
              <p>Max appointments per day: 4</p>
              <p className="mt-2">Edit these settings in the Scheduler page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
