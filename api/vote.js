const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

module.exports = async (req, res) => {
    // CORS Header (개발용 접근 허용)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { menu } = req.body;
        
        if (!menu) {
            return res.status(400).json({ error: 'Menu is required' });
        }

        // 인증 정보 확인
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            return res.status(500).json({ error: 'Server configuration error (Missing credentials)' });
        }

        // Initialize auth
        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
            ],
        });

        // The sheet ID from your URL
        const doc = new GoogleSpreadsheet('1EQlzr9hgwljmjys8gNihwb299-ATdPe2ssN9k3tkMU4', serviceAccountAuth);

        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        // Generate timestamp
        const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
        
        // Convert the internal id ('bibimbap') back to readable Korean label for the column
        const menuLabels = {
            'bibimbap': '비빔밥',
            'tonkatsu': '돈까스',
            'gukbap': '국밥',
            'salad': '샐러드'
        };

        const label = menuLabels[menu] || menu;

        // 컬럼명: timestamp, menu, voter 라고 가정 (또는 헤더 없는 빈 시트의 A, B, C 열)
        // 만약 헤더가 설정되어 있지 않다면 에러가 날 수 있으므로, 헤더가 있는지 확인하고 배열로 삽입
        await sheet.addRow([timestamp, label, req.headers['x-forwarded-for'] || '익명']);

        return res.status(200).json({ success: true, message: '투표가 기록되었습니다.' });

    } catch (error) {
        console.error('Error updating Google Sheets:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
