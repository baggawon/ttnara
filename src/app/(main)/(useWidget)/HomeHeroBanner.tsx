import Image from "next/image";
import Link from "next/link";

export const HomeHeroBanner = ({
  imageUrl,
  actionUrl,
}: {
  imageUrl?: string | null;
  actionUrl?: string | null;
}) => {
  if (!imageUrl) return null;

  const image = (
    <Image
      src={imageUrl}
      alt="배너"
      width={1920}
      height={480}
      className="w-full h-auto object-cover rounded-lg"
      unoptimized
      priority
    />
  );

  if (!actionUrl) {
    return <div className="w-full">{image}</div>;
  }

  if (/^https?:\/\//i.test(actionUrl)) {
    return (
      <a
        href={actionUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full"
      >
        {image}
      </a>
    );
  }

  return (
    <Link href={actionUrl} className="block w-full">
      {image}
    </Link>
  );
};
