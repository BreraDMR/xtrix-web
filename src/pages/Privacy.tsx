import { Link } from 'react-router-dom'

// Keep this short notice until the full legal documents are ready.
export default function Privacy() {
  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-12 text-[var(--workspace-ink)] sm:py-16">
      <article className="mx-auto max-w-2xl space-y-5 text-sm leading-relaxed">
        <h1 className="page-title">Xtrix — Политика конфиденциальности</h1>
        <p>Xtrix — сервис для управления салоном и работы с клиентами. Не вносите сюда настоящие данные своих клиентов.</p>
        <p><strong>Вход через Google.</strong> Мы получаем только ваше имя, адрес почты и идентификатор аккаунта Google и используем их только для входа. Доступа к вашей почте, контактам и файлам у нас нет.</p>
        <p>Ваши данные в Xtrix (салон, клиенты, визиты) хранятся у хостинг-провайдеров Neon, Render и Vercel и используются только для работы сервиса. Мы их не продаём и никому не передаём.</p>
        <p><strong>ИИ-помощник.</strong> Текст ваших запросов к помощнику обрабатывают внешние модели (OpenRouter, Google Gemini, Groq, Mistral, Cloudflare, Z.ai). Бесплатные тарифы этих сервисов могут использовать запросы для улучшения своих моделей, поэтому не пишите помощнику личные данные.</p>
        <p><strong>Удаление.</strong> Напишите на <a href="mailto:damir.brera.eb@gmail.com" className="font-medium text-[var(--workspace-accent)] underline">damir.brera.eb@gmail.com</a>, и мы удалим ваш аккаунт со всеми данными. Данные этой версии могут очистить в любой момент.</p>
        <p className="pt-4"><Link to="/" className="font-medium text-[var(--workspace-accent)]">Xtrix</Link></p>
      </article>
    </main>
  )
}
