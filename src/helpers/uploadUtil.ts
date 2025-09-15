import { _tempVideoFiles } from "@/components/2_molecules/Input/CkeditorPlugins/VideoUploadPlugin";

export const extractMediaFromHtml = (htmlString: string) => {
  const formData = new FormData();
  let modifiedHtml = htmlString;
  let fileIndex = 0;

  // 1. 이미지 base64 처리
  const imgTagPattern =
    /<img[^>]+src="data:image\/([a-zA-Z]*);base64,([^"]*)"[^>]*>/g;

  modifiedHtml = modifiedHtml.replace(
    imgTagPattern,
    (match, imageType, base64Data) => {
      try {
        // base64를 Blob으로 변환
        const byteCharacters = atob(base64Data);
        const byteArrays = [];

        for (let i = 0; i < byteCharacters.length; i += 512) {
          const slice = byteCharacters.slice(i, i + 512);
          const byteNumbers = new Array(slice.length);

          for (let j = 0; j < slice.length; j++) {
            byteNumbers[j] = slice.charCodeAt(j);
          }

          byteArrays.push(new Uint8Array(byteNumbers));
        }

        const blob = new Blob(byteArrays, { type: `image/${imageType}` });
        const fileName = `image_${fileIndex}.${imageType}`;

        // FormData에 파일 추가
        formData.append("mediaFiles", blob, fileName);

        // 메타데이터 추가
        formData.append(
          `mediaMeta_${fileIndex}`,
          JSON.stringify({
            type: "image",
            fileIndex,
            originalName: fileName,
            mineType: `image/${imageType}`,
          })
        );

        // HTML에서 base64를 파일 참조로 대체
        const placeholder = `<img data-media-ref="${fileIndex}" data-media-type="image" />`;
        fileIndex++;

        return placeholder;
      } catch (error) {
        console.error("이미지 변환 중 에러:", error);
        return match; // 에러 발생 시 원본 유지
      }
    }
  );

  // 2. CKEditor의 mediaEmbed 내 비디오 태그 처리 - source 태그에 집중
  const sourceTagPattern = /<source[^>]+src="(blob:[^"]+)"[^>]*>/g;
  const sourceMatches = [];
  let sourceMatch;

  // 모든 source 태그와 blob URL 수집
  while ((sourceMatch = sourceTagPattern.exec(htmlString)) !== null) {
    const blobUrl = sourceMatch[1];
    sourceMatches.push({
      fullMatch: sourceMatch[0],
      blobUrl: blobUrl,
      startIndex: sourceMatch.index,
      endIndex: sourceMatch.index + sourceMatch[0].length,
    });
  }

  // 수집된 source 태그 처리
  for (const match of sourceMatches) {
    const blobUrl = match.blobUrl;

    // 각 blob URL에 대해 _tempVideoFiles 객체에서 파일 찾기
    let videoFile = null;

    // 정확한 URL로 파일 찾기
    if (_tempVideoFiles[blobUrl]) {
      videoFile = _tempVideoFiles[blobUrl];
    }
    // URL이 정확히 일치하지 않는 경우, UUID 부분만 비교
    else {
      const blobUuid = blobUrl.split("/").pop();
      const matchingKey = Object.keys(_tempVideoFiles).find(
        (key) => blobUuid && key.includes(blobUuid)
      );

      if (matchingKey) {
        videoFile = _tempVideoFiles[matchingKey];
      }
    }

    // 파일을 찾은 경우 처리
    if (videoFile) {
      const fileExt = videoFile.name.split(".").pop() || "mp4";
      const fileName = `video_${fileIndex}.${fileExt}`;

      // FormData에 비디오 파일 추가
      formData.append("mediaFiles", videoFile, fileName);

      // 비디오 메타데이터 추가
      formData.append(
        `mediaMeta_${fileIndex}`,
        JSON.stringify({
          type: "video",
          fileIndex,
          originalName: videoFile.name,
          mimeType: videoFile.type,
        })
      );

      // 전체 figure 태그 찾아서 대체
      const figurePattern = new RegExp(
        `<figure class="media">.*?${escapeRegExp(match.fullMatch)}.*?</figure>`,
        "s" // s 플래그로 개행 문자도 매치
      );

      const figureMatch = figurePattern.exec(modifiedHtml);

      if (figureMatch) {
        // figure 태그 전체를 대체
        const placeholder = `<figure class="media"><div data-media-ref="${fileIndex}" data-media-type="video"></div></figure>`;
        modifiedHtml = modifiedHtml.replace(figureMatch[0], placeholder);
      } else {
        // source 태그만 대체 (fallback)
        const sourcePlaceholder = `<source src="data-media-ref-${fileIndex}" type="video/mp4">`;
        modifiedHtml = modifiedHtml.replace(match.fullMatch, sourcePlaceholder);
      }

      fileIndex++;

      // blob URL 해제
      URL.revokeObjectURL(blobUrl);
    } else {
      console.log("임시 파일을 찾을 수 없음:", blobUrl);
    }
  }

  return {
    formData,
    modifiedHtml,
    mediaCount: fileIndex,
  };
};

// 정규식에서 특수 문자를 이스케이프하는 헬퍼 함수
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
