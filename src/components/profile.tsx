import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function Profile() {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="ghost">Login</Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "size-8",
            }
          }}
        />
      </SignedIn>
    </>
  );
}

