// Strip CloudFront signing query params from URLs in HTML before reloading
// content into the editor for further editing.
export const stripCloudFrontSignaturesClient = (html: string): string => {
  return html.replace(
    /((?:data-oembed-url|src)="https?:\/\/[^"?]+)\?[^"]*/g,
    "$1"
  );
};
