interface CachetUserResponse {
  id: string;
  userId: string;
  displayName: string;
  realName: string;
  pronouns: string;
  imageUrl: string;
}
export async function getUserInfo(id: string) {
  try {
    const res = await fetch(`https://cachet.hackclub.com/users/${id}`);
    const user: CachetUserResponse = await res.json();

    // Resize avatars to 48px
    const imageUrl = user.imageUrl.replace("_512", "_48");
    return { ...user, imageUrl };
  } catch (e) {
    // Return some fallback info
    return {
      id,
      userId: id,
      displayName: id,
      realName: id,
      pronouns: "",
      imageUrl: `https://cachet.hackclub.com/users/${id}/r`,
    } satisfies CachetUserResponse;
  }
}
