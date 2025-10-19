import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, purpose } = body;

    // 입력 값 검증
    if (!email || !purpose) {
      return NextResponse.json(
        { error: '이메일과 사용목적을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('Discord webhook URL이 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Discord Webhook 메시지 전송
    const discordMessage = {
      embeds: [
        {
          title: '🎓 새로운 가입 요청',
          color: 0x5865f2, // Discord 블루 컬러
          fields: [
            {
              name: '📧 이메일',
              value: email,
              inline: false,
            },
            {
              name: '📝 사용목적',
              value: purpose,
              inline: false,
            },
            {
              name: '⏰ 요청 시간',
              value: new Date().toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
              }),
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordMessage),
    });

    if (!response.ok) {
      throw new Error('Discord webhook 전송 실패');
    }

    return NextResponse.json(
      { message: '가입 요청이 성공적으로 전송되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('가입 요청 처리 중 오류:', error);
    return NextResponse.json(
      { error: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
