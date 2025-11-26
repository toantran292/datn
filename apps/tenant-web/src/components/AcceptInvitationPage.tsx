import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { apiPost } from "../lib/api";

interface AcceptInvitationPageProps {
  token: string;
  onSuccess: () => void;
}

export function AcceptInvitationPage({ token, onSuccess }: AcceptInvitationPageProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isExistingUser && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!isExistingUser && password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiPost<{ status: string; userId: string; orgId: string }>(
        "/tenant/public/invitations/accept",
        {
          token,
          password: isExistingUser ? undefined : password,
        }
      );

      toast.success("Invitation accepted successfully!", {
        description: "You are now a member of the organization.",
      });

      // Redirect to login or workspace after success
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error("Failed to accept invitation:", error);
      toast.error("Failed to accept invitation", {
        description: error?.error || error?.message || "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Accept Invitation</CardTitle>
          <CardDescription>
            You've been invited to join an organization. Complete the form below to accept.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="existingUser"
                  checked={isExistingUser}
                  onChange={(e) => setIsExistingUser(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="existingUser" className="text-sm font-normal cursor-pointer">
                  I already have an account
                </Label>
              </div>
            </div>

            {!isExistingUser && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Create Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isExistingUser}
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={!isExistingUser}
                  />
                </div>
              </>
            )}

            {isExistingUser && (
              <div className="text-sm text-muted-foreground">
                You will be added to the organization using your existing account.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Accepting..." : "Accept Invitation"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
