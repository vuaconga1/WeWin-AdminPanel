import { redirect } from "next/navigation";

/** Legacy URL — home is now `/`. */
export default function PlacementRedirectPage() {
  redirect("/");
}
