"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useVersionStore } from "@/helpers/state";
import { map } from "@/helpers/basic";
import { EasyDialog } from "@/components/1_atoms/EasyModal";

const VersionManage = () => {
  const versionStore = useVersionStore((state) => state);

  const burstCache = async () => {
    if (window?.caches) {
      const cacheNames = await window.caches.keys();
      const cacheDeletionPromises = map(cacheNames, (n) =>
        window.caches.delete(n)
      );
      await Promise.all(cacheDeletionPromises);
    }
    versionStore.resetRequest();
    window.location.reload();
  };

  return (
    <EasyDialog
      open={versionStore.open}
      setOpen={(value) => {
        if (value) {
          versionStore.openRequest();
        } else {
          versionStore.resetRequest();
        }
      }}
      button={<Button type="button" className="hidden" />}
      title="알림"
      description="현재 구버젼을 이용하고 있습니다. 확인시 새 버젼으로 이용합니다."
    >
      <div className="w-full text-center mt-4">
        <Button type="button" onClick={burstCache} className="w-[104px]">
          확인
        </Button>
      </div>
    </EasyDialog>
  );
};

export default VersionManage;
