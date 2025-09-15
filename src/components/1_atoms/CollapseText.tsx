"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export const CollapseText = ({ text }: { text: string }) => {
  const [collapsed, setCollapsed] = useState(text.length <= 100);
  let convertText = text;
  if (!collapsed) convertText = text.slice(0, 100);
  return (
    <div>
      {convertText}
      {text.length > 100 && (
        <Button
          type="button"
          variant="link"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "접기" : "더보기"}
        </Button>
      )}
    </div>
  );
};
