import { NextResponse } from "next/server";

const assetLinks = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.nexgigs.app",
      sha256_cert_fingerprints: [
        "2D:FE:7A:9B:16:BE:4E:A6:A4:F1:AA:B0:02:0E:C0:B7:F2:37:8A:0F:10:D8:8C:F7:83:7B:1A:B6:AF:30:82:C0",
      ],
    },
  },
];

export async function GET() {
  return NextResponse.json(assetLinks, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
