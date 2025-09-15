import { Plugin, ButtonView, FileRepository } from "ckeditor5";

// 전역 변수로 임시 비디오 파일 저장
// 이 변수는 CKEditor 컴포넌트가 마운트될 때마다 초기화되어야 합니다
export const _tempVideoFiles: { [key: string]: File } = {};

// 비디오 업로드 아이콘 정의
const videoUploadIcon = `<svg version="1.1" id="레이어_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"
	 y="0px" width="20px" height="20px" viewBox="0 0 20 20" enable-background="new 0 0 20 20" xml:space="preserve" >
   <path
   fill="none"
   className="stroke-primary" 
   strokeWidth="1.2"
   d="M3,2h14c0.553,0,1,0.448,1,1v14c0,0.553-0.447,1-1,1H3
   c-0.552,0-1-0.447-1-1V3C2,2.448,2.448,2,3,2z"
 />
 <path
   className="fill-primary"
   d="M7.351,7.515v4.971c0,0.456,0.371,0.828,0.828,0.828c0.144,0,0.286-0.039,0.411-0.11l4.142-2.484
   c0.398-0.227,0.534-0.734,0.308-1.13c-0.073-0.129-0.18-0.234-0.308-0.308L8.59,6.796C8.193,6.569,7.687,6.707,7.46,7.104
   C7.389,7.229,7.351,7.371,7.351,7.515z"
 />
 <path
   fill="none"
   className="stroke-primary"
   strokeWidth="1.5"
   strokeLinecap="round"
   strokeLinejoin="round"
   d="M15,17.125v-6 M12,14.125 l3-3l3,3"
 />
</svg>`;

export default class VideoUploadPlugin extends Plugin {
  static get pluginName() {
    return "VideoUpload";
  }

  static get requires() {
    return [FileRepository];
  }

  init() {
    const editor = this.editor;
    console.log("VideoUploadPlugin 초기화 시작");

    // UI 컴포넌트 등록
    this._registerUI();

    console.log("VideoUploadPlugin 초기화 완료");
  }

  _registerUI() {
    const editor = this.editor;
    const t = editor.t;

    // UI 컴포넌트 팩토리에 등록
    editor.ui.componentFactory.add("videoUpload", (locale) => {
      const button = new ButtonView(locale);

      button.set({
        label: t("비디오 업로드"),
        icon: videoUploadIcon,
        tooltip: true,
        class: "stroke-primary",
      });

      // 버튼 클릭 이벤트
      button.on("execute", () => {
        console.log("비디오 업로드 버튼 클릭");
        this._showFileSelector();
      });

      return button;
    });

    console.log("VideoUploadPlugin: UI 등록 완료");
  }

  _showFileSelector() {
    const editor = this.editor;

    // 파일 선택기 생성
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";

    // 파일 선택 시 처리
    input.onchange = () => {
      if (!input.files?.length) return;

      const file = input.files[0];

      // 로딩 상태 표시 (필요 시)
      editor.model.document.fire("videoUploadStart");

      // 파일을 Blob URL로 변환
      const blobUrl = URL.createObjectURL(file);
      _tempVideoFiles[blobUrl] = file;

      // MediaEmbed 명령어를 사용하여 비디오 삽입
      // 이 방식은 mediaEmbed 플러그인을 통해 처리됨
      editor.execute("mediaEmbed", blobUrl);

      // 로딩 상태 해제
      editor.model.document.fire("videoUploadComplete");
      editor.editing.view.focus();
    };

    // 파일 선택 다이얼로그 표시
    input.click();
  }
}
