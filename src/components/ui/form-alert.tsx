import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "cn";

/**
 * A failure the whole form hit, as opposed to one field's.
 *
 * Wrong credentials, an unreachable API, an unexplained 500: none of these go
 * under an input, because no input is at fault. It sits right below the submit
 * button, which is where you're already looking once you've pressed it.
 *
 * Bare text, not a panel. It follows the one control on the card that already
 * carries weight, so weight and colour are enough to get it noticed.
 *
 * Still an `Alert` underneath, for the `role="alert"` that gets a screen reader
 * to announce it.
 *
 * `tone="success"` is the same sentence in the same spot for the opposite
 * outcome: a form that stays put once it has saved needs to say so, and saying
 * it where the failure would have gone means one place to look either way.
 */
export function FormAlert({
  children,
  className,
  tone = "danger",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "danger" | "success";
}) {
  return (
    <Alert
      variant="destructive"
      className={cn(
        // Base Alert is a bordered, padded, left-aligned panel. Strip all that.
        "block border-0 bg-transparent p-0 text-center",
        // Comes in from just above, so a message replacing an earlier one reads
        // as new instead of quietly swapping in place.
        "animate-in fade-in slide-in-from-top-1 duration-200 motion-reduce:animate-none",
        className,
      )}
    >
      <AlertDescription
        className={cn(
          "text-[13px] font-bold sm:text-sm",
          tone === "success" ? "text-success" : "text-destructive",
        )}
      >
        {children}
      </AlertDescription>
    </Alert>
  );
}
