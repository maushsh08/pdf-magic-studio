import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PDFマジックスタジオ — Merge & Split PDFs in your browser" },
      { name: "description", content: "Privacy-first PDF tools. Merge, split, and extract pages directly in your browser. No uploads, no servers." },
      { name: "theme-color", content: "#5b6cf0" },
      { property: "og:title", content: "PDFマジックスタジオ — Merge & Split PDFs in your browser" },
      { property: "og:description", content: "Privacy-first PDF tools. Merge, split, and extract pages directly in your browser. No uploads, no servers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "PDFマジックスタジオ — Merge & Split PDFs in your browser" },
      { name: "twitter:description", content: "Privacy-first PDF tools. Merge, split, and extract pages directly in your browser. No uploads, no servers." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/969c0149-1f6e-44dc-ba9b-80620bd1656f/id-preview-3ef0d022--c2131909-346f-44c5-9879-4f0bac67350d.lovable.app-1777685469883.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/969c0149-1f6e-44dc-ba9b-80620bd1656f/id-preview-3ef0d022--c2131909-346f-44c5-9879-4f0bac67350d.lovable.app-1777685469883.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/icon-192.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
