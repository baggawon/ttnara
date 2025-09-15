import dayjs from "dayjs";

const MainFooterWidget = () => {
  return (
    <footer className="hidden md:flex w-full py-4 ">
      <div className="w-full">
        <p className="text-sm leading-[1.8] text-center">
          {/* 오늘: 10,770명 / 어제: 21,295명 / 최대: 174,330명 / 전체:
          278,704,365명
          <br /> */}
          모든 이미지는 회원이 직접 올린 것이며, 사진에 대한 권리는 해당
          저작권자에게 있습니다.
          <br />
          타인의 저작물을 불법적으로 이용시에는 제재가 가해질 수 있으며, 이에
          대하여 당사는 책임지지 않습니다.
          <br />
          &copy; {dayjs().year()} 테더나라. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
};

export default MainFooterWidget;
