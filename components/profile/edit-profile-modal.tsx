"use client";

import { useState, useTransition, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/app/actions/user";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface EditProfileModalProps {
  user: {
    name: string | null;
    bio: string | null;
    study: string | null;
    work: string | null;
    address: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({ user, open, onOpenChange }: EditProfileModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: user.name || "",
    bio: user.bio || "",
    study: user.study || "",
    work: user.work || "",
    address: user.address || "",
  });

  // Update form data when user prop changes (e.g. after a refresh)
  useEffect(() => {
    setFormData({
      name: user.name || "",
      bio: user.bio || "",
      study: user.study || "",
      work: user.work || "",
      address: user.address || "",
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateProfile(formData);
        if (result.success) {
          toast.success("Profile updated successfully");
          onOpenChange(false);
          router.refresh();
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to update profile");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-zinc-400">
              Name
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="bg-zinc-900/50 border-zinc-800 focus:ring-emerald-500 h-11"
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bio" className="text-sm font-medium text-zinc-400">
              Bio
            </label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="bg-zinc-900/50 border-zinc-800 focus:ring-emerald-500 min-h-[120px] resize-none"
              placeholder="Write a short bio about yourself..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="study" className="text-sm font-medium text-zinc-400">
                Study
              </label>
              <Input
                id="study"
                name="study"
                value={formData.study}
                onChange={handleChange}
                className="bg-zinc-900/50 border-zinc-800 focus:ring-emerald-500 h-11"
                placeholder="Where did you study?"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="work" className="text-sm font-medium text-zinc-400">
                Work
              </label>
              <Input
                id="work"
                name="work"
                value={formData.work}
                onChange={handleChange}
                className="bg-zinc-900/50 border-zinc-800 focus:ring-emerald-500 h-11"
                placeholder="Where do you work?"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="address" className="text-sm font-medium text-zinc-400">
              Location
            </label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="bg-zinc-900/50 border-zinc-800 focus:ring-emerald-500 h-11"
              placeholder="City, Country"
            />
          </div>

          <DialogFooter className="pt-6 sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-800 bg-red-400 text-white px-6  "
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-500 text-black hover:bg-emerald-400 font-bold px-8 transition-all active:scale-95"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
