import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, organization, purpose, message } = body;

    // 필수 필드 검증
    if (!name || !email || !purpose) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Discord Webhook URL 확인
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('Discord webhook URL is not configured');
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      );
    }

    // 사용 목적 한글 변환
    const purposeMap: Record<string, string> = {
      student: '시험 준비 (학생)',
      teacher: '수업 준비 (교사)',
      certificate: '자격증 공부',
      job: '취업 준비',
      self: '독학/자기계발',
      other: '기타'
    };

    // 신청 일시
    const timestamp = new Date().toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Discord Embed 메시지 구성
    const discordPayload = {
      embeds: [
        {
          title: '🎓 AI Professor 신규 신청',
          description: '새로운 서비스 신청이 접수되었습니다.',
          color: 0x4F46E5, // Purple color
          fields: [
            {
              name: '👤 이름',
              value: name,
              inline: true
            },
            {
              name: '📧 이메일',
              value: email,
              inline: true
            },
            {
              name: '🏢 소속',
              value: organization || '미입력',
              inline: true
            },
            {
              name: '🎯 사용 목적',
              value: purposeMap[purpose] || purpose,
              inline: false
            },
            ...(message ? [{
              name: '💬 문의사항',
              value: message.length > 1024 ? message.substring(0, 1021) + '...' : message,
              inline: false
            }] : []),
            {
              name: '⏰ 신청 일시',
              value: timestamp,
              inline: false
            }
          ],
          footer: {
            text: 'AI Professor Landing'
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    // Discord Webhook 전송
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }

    return NextResponse.json(
      { message: '신청이 성공적으로 전송되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Discord webhook error:', error);
    return NextResponse.json(
      { error: '전송에 실패했습니다. 나중에 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
