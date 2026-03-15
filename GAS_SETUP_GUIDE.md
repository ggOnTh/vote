# Google Apps Script 설정 및 연동 가이드

Vercel 백엔드 없이 순수 HTML/JS 정적 파일만으로 구글 시트를 데이터베이스처럼 사용하기 위해 "Google Apps Script(GAS)"를 활용하는 방식입니다.

## 1. Google Apps Script 생성
1. 구글 시트(`실시간 점심 메뉴 투표`)를 엽니다.
2. 상단 메뉴에서 **[확장 프로그램] > [Apps Script]** 를 클릭합니다.
3. 열린 에디터 화면에서 기본 코드(`myFunction`)를 지우고 아래의 코드를 복사하여 붙여넣습니다.

```javascript
/* 투표 결과를 기록할 스프레드시트의 ID */
const SHEET_ID = '1EQlzr9hgwljmjys8gNihwb299-ATdPe2ssN9k3tkMU4';

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    const timestamp = new Date();
    
    // 프론트엔드에서 전송한 데이터 메뉴 정보 받기
    let menu = "";
    if (e.parameter && e.parameter.menu) {
      menu = e.parameter.menu;  // x-www-form-urlencoded 방식일 경우
    } else if (e.postData && e.postData.contents) {
      try {
        const data = JSON.parse(e.postData.contents);
        menu = data.menu; // JSON 방식일 경우
      } catch(err) {
        menu = e.postData.contents;
      }
    }

    // 내부 ID를 다시 한글 메뉴명으로 변환
    const menuLabels = {
        'bibimbap': '비빔밥',
        'tonkatsu': '돈까스',
        'gukbap': '국밥',
        'salad': '샐러드'
    };
    const label = menuLabels[menu] || menu;

    if (!label) {
      return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": "Menu is required" }))
          .setMimeType(ContentService.MimeType.JSON);
    }
    
    // A열: Timestamp, B열: Menu, C열: Voter (정적 페이지 특성상 익명으로 기록)
    sheet.appendRow([timestamp, label, "Anonymous User"]);
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "success", "data": label }))
          .setMimeType(ContentService.MimeType.JSON);
          
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
          .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## 2. 웹 앱(Web App)으로 배포하기
코드를 작성했다면 이를 외부 응용 프로그램(우리의 프론트엔드 앱)에서 호출할 수 있도록 웹 앱으로 배포해야 합니다.

1. Apps Script 에디터 우측 상단의 **[배포(Deploy)] > [새 배포(New deployment)]** 클릭
2. 톱니바퀴 (설정) 아이콘 클릭 후 **'웹 앱(Web app)'** 선택
3. **설정값 변경 (매우 중요!)**
    - **실행 주체(Execute as)**: `나(Me)` (자신의 구글 계정)
    - **액세스할 수 있는 사용자(Who has access)**: `모든 사용자(Anyone)` 
4. **[배포]** 버튼 클릭
5. '액세스 승인' 창이 나타나면 자신의 구글 계정으로 로그인 후, **고급 > '[프로젝트 이름](으)로 이동(안전하지 않음)'** 을 클릭하여 권한을 허용합니다.
6. 배포가 완료되면 화면에 **웹 앱 URL(Web app URL)** 이 나타납니다. (형태: `https://script.google.com/macros/s/....../exec`) 이를 복사합니다.

## 3. 프론트엔드 코드에 적용하기
`Vote-Project/public/script.js` 파일을 열고 약 79번째 줄에 있는 `GAS_URL` 변수에 복사해 둔 URL을 붙여넣습니다.

```javascript
// Before
const GAS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';

// After (예시)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxyz.../exec';
```

---

### 🎉 완료되었습니다!
이제 VS Code의 Live Server나 Vercel 등 어디에서 호스팅하더라도, 별도의 백엔드 코드나 환경 변수 파일 없이 오직 `script.js`의 `fetch()` 통신만으로 구글 시트에 데이터가 기록되고 실시간으로 결과가 화면에 갱신됩니다.
