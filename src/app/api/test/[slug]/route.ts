export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  console.log("req", request);
  console.log("params", { slug });

  return new Response("User deleted successfully! id=" + slug, { status: 200 });
}
