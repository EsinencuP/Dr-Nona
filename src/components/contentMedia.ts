// Keep the official asset identity; remove only the imported delivery crop.
// Unknown providers/URL shapes retain their source URL.
export function uncroppedOfficialImage(src: string) {
  return src.replace(
    /^(https:\/\/res\.cloudinary\.com\/drnona-com\/image\/upload\/)(?:[a-z]+_[a-zA-Z0-9.]+,)*[a-z]+_[a-zA-Z0-9.]+(?=\/(?:news|blog|pages)\/)/,
    "$1f_auto,q_auto,w_1200,c_limit"
  );
}

// Only inspected, text-free photography may be cropped. Unclassified artwork
// defaults to preservation, including text baked into an image.
export function editorialMediaRole(path: string): "photo" | "artwork" {
  return path === "/news/inactive-cleanup" ? "photo" : "artwork";
}
