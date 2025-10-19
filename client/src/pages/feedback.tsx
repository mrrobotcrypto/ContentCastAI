import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Star,
  Send,
  CheckCircle
} from "lucide-react";

type FeedbackType = "bug" | "feature" | "general" | "compliment";

export default function Feedback() {
  const [feedbackType, setFeedbackType] = useState<FeedbackType | "">("");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const feedbackMutation = useMutation({
    mutationFn: async (data: { type: FeedbackType; message: string }) => {
      const response = await apiRequest("POST", "/api/feedback", data);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      setMessage("");
      setFeedbackType("");
      toast({
        title: t("feedback.success") || "Feedback Sent!",
        description: t("feedback.successDesc") || "Thank you for your feedback. We appreciate your input!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
    },
    onError: (error: any) => {
      toast({
        title: t("feedback.error") || "Error",
        description: error.message || t("feedback.errorDesc") || "Failed to send feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackType) {
      toast({
        title: t("feedback.typeRequired") || "Feedback Type Required",
        description: t("feedback.typeRequiredDesc") || "Please select a feedback type",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: t("feedback.messageRequired") || "Message Required",
        description: t("feedback.messageRequiredDesc") || "Please enter your feedback message",
        variant: "destructive",
      });
      return;
    }

    if (message.trim().length < 10) {
      toast({
        title: t("feedback.messageTooShort") || "Message Too Short",
        description: t("feedback.messageTooShortDesc") || "Please provide more detailed feedback (at least 10 characters)",
        variant: "destructive",
      });
      return;
    }

    feedbackMutation.mutate({
      type: feedbackType as FeedbackType,
      message: message.trim(),
    });
  };

  const feedbackOptions = [
    {
      value: "bug" as FeedbackType,
      label: t("feedback.types.bug") || "Bug Report",
      description: t("feedback.types.bugDesc") || "Report a problem or error",
      icon: Bug,
      color: "text-red-500"
    },
    {
      value: "feature" as FeedbackType,
      label: t("feedback.types.feature") || "Feature Request",
      description: t("feedback.types.featureDesc") || "Suggest a new feature or improvement",
      icon: Lightbulb,
      color: "text-yellow-500"
    },
    {
      value: "general" as FeedbackType,
      label: t("feedback.types.general") || "General Feedback",
      description: t("feedback.types.generalDesc") || "Share your thoughts or suggestions",
      icon: MessageSquare,
      color: "text-blue-500"
    },
    {
      value: "compliment" as FeedbackType,
      label: t("feedback.types.compliment") || "Compliment",
      description: t("feedback.types.complimentDesc") || "Share what you love about the app",
      icon: Star,
      color: "text-green-500"
    }
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t("feedback.thankYou") || "Thank You!"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t("feedback.thankYouDesc") || "Your feedback has been sent successfully. We really appreciate your input and will review it carefully."}
            </p>
            <Button 
              onClick={() => setIsSubmitted(false)}
              data-testid="button-send-more-feedback"
            >
              {t("feedback.sendMore") || "Send More Feedback"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 mr-2 text-primary" />
            {t("feedback.title") || "Feedback"}
          </h1>
          <p className="text-muted-foreground">
            {t("feedback.subtitle") || "Help us improve FarcastAI by sharing your thoughts, reporting bugs, or suggesting new features"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t("feedback.typeLabel") || "Feedback Type"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={feedbackType} onValueChange={(value) => setFeedbackType(value as FeedbackType | "")}>
                <SelectTrigger data-testid="select-feedback-type">
                  <SelectValue placeholder={t("feedback.typePlaceholder") || "Select feedback type..."} />
                </SelectTrigger>
                <SelectContent>
                  {feedbackOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <Icon className={`w-4 h-4 mr-2 ${option.color}`} />
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Feedback Message */}
          <Card>
            <CardHeader>
              <CardTitle>{t("feedback.messageLabel") || "Your Message"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="feedback-message" className="sr-only">
                {t("feedback.messageLabel") || "Your Message"}
              </Label>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("feedback.messagePlaceholder") || "Please describe your feedback in detail. Be specific about any issues, suggestions, or compliments you'd like to share..."}
                className="min-h-32 resize-none"
                maxLength={1000}
                data-testid="textarea-feedback-message"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">
                  {t("feedback.minLength") || "Minimum 10 characters"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {message.length}/1000
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                type="submit"
                disabled={feedbackMutation.isPending}
                className="w-full"
                data-testid="button-submit-feedback"
              >
                {feedbackMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {t("feedback.sending") || "Sending..."}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {t("feedback.send") || "Send Feedback"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Guidelines */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t("feedback.guidelines.title") || "Feedback Guidelines"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start">
                <Bug className="w-4 h-4 mr-2 mt-0.5 text-red-500 flex-shrink-0" />
                <div>
                  <strong>{t("feedback.guidelines.bugs") || "Bug Reports:"}</strong>{" "}
                  {t("feedback.guidelines.bugsDesc") || "Please include detailed steps to reproduce the issue and your browser information."}
                </div>
              </div>
              <div className="flex items-start">
                <Lightbulb className="w-4 h-4 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" />
                <div>
                  <strong>{t("feedback.guidelines.features") || "Feature Requests:"}</strong>{" "}
                  {t("feedback.guidelines.featuresDesc") || "Explain how the feature would benefit you and other users."}
                </div>
              </div>
              <div className="flex items-start">
                <MessageSquare className="w-4 h-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                <div>
                  <strong>{t("feedback.guidelines.general") || "General Feedback:"}</strong>{" "}
                  {t("feedback.guidelines.generalDesc") || "Share your overall experience and suggestions for improvement."}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  );
}