"use client";

import Link from "next/link";
import { useTracking } from "@/hooks/use-tracking";
import { ReactNode } from "react";

interface NextChapterLinkProps {
  storySlug: string;
  fromChapterSlug: string;
  href: string;
  children: ReactNode;
  className?: string;
}

export function NextChapterLink({ storySlug, fromChapterSlug, href, children, className }: NextChapterLinkProps) {
  const { trackNextChapterClick } = useTracking();
  
  return (
    <Link 
      href={href} 
      className={className} 
      onClick={() => trackNextChapterClick(storySlug, fromChapterSlug)}
    >
      {children}
    </Link>
  );
}
