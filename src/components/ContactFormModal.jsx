import { useEffect, useMemo, useState } from 'react';
import { siteProfile } from '../data/siteProfile.js';

const INITIAL_FORM_STATE = {
  name: '',
  contact: '',
  message: '',
  company: '',
};

function encodeFormPayload(payload) {
  return Object.entries(payload)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export default function ContactFormModal({ open = false, onClose, theme = 'light' }) {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [submitState, setSubmitState] = useState('idle');

  const primaryEmail = useMemo(
    () => siteProfile.contacts.find((item) => item.label === '邮箱')?.value ?? '',
    [],
  );

  useEffect(() => {
    if (open) return undefined;
    setFormState(INITIAL_FORM_STATE);
    setSubmitState('idle');
    return undefined;
  }, [open]);

  if (!open) return null;

  function handleChange(event) {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitState === 'submitting') return;

    const payload = {
      'form-name': 'contact',
      company: formState.company,
      name: formState.name.trim(),
      contact: formState.contact.trim(),
      message: formState.message.trim(),
    };

    setSubmitState('submitting');

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: encodeFormPayload(payload),
      });

      if (!response.ok) {
        throw new Error(`Netlify form submit failed: ${response.status}`);
      }

      setFormState(INITIAL_FORM_STATE);
      setSubmitState('success');
    } catch (error) {
      console.error(error);
      setSubmitState('error');
    }
  }

  return (
    <div className="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
      <button
        className="contact-modal__scrim"
        type="button"
        aria-label="关闭联系表单"
        onClick={onClose}
      />

      <section className={`contact-modal__panel contact-modal__panel--${theme}`}>
        <header className="contact-modal__header">
          <div>
            <p className="contact-modal__eyebrow">Contact</p>
            <h2 className="contact-modal__title" id="contact-modal-title">联系我</h2>
          </div>
          <button
            className="contact-modal__close"
            type="button"
            aria-label="关闭联系表单"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <p className="contact-modal__intro">
          留下称呼、联系方式和想说的话就可以。提交后，消息会先进入网站表单接收端，再通知到
          {primaryEmail ? ` ${primaryEmail}` : ' 你的接收邮箱'}。
        </p>

        <form
          className="contact-modal__form"
          name="contact"
          method="POST"
          data-netlify="true"
          data-netlify-honeypot="company"
          onSubmit={handleSubmit}
        >
          <input type="hidden" name="form-name" value="contact" />

          <p className="contact-modal__honeypot" hidden>
            <label htmlFor="contact-company">Company</label>
            <input
              id="contact-company"
              name="company"
              autoComplete="off"
              tabIndex={-1}
              value={formState.company}
              onChange={handleChange}
            />
          </p>

          <label className="contact-modal__field" htmlFor="contact-name">
            <span>称呼</span>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="怎么称呼你"
              value={formState.name}
              onChange={handleChange}
              required
            />
          </label>

          <label className="contact-modal__field" htmlFor="contact-method">
            <span>联系方式</span>
            <input
              id="contact-method"
              name="contact"
              type="text"
              autoComplete="email"
              placeholder="邮箱 / 微信 / 其他方式"
              value={formState.contact}
              onChange={handleChange}
              required
            />
          </label>

          <label className="contact-modal__field contact-modal__field--textarea" htmlFor="contact-message">
            <span>留言内容</span>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              placeholder="想合作、想交流，或者只是想打个招呼，都可以写在这里。"
              value={formState.message}
              onChange={handleChange}
              required
            />
          </label>

          <div className="contact-modal__footer">
            <div className="contact-modal__status" aria-live="polite">
              {submitState === 'success' ? '已收到，你的留言已经提交成功。' : null}
              {submitState === 'error' ? '提交没有成功，请稍后再试，或直接发邮件给我。' : null}
              {submitState === 'submitting' ? '正在提交...' : null}
            </div>

            <div className="contact-modal__actions">
              {primaryEmail ? (
                <a className="contact-modal__mail" href={`mailto:${primaryEmail}`}>
                  直接发邮件
                </a>
              ) : null}
              <button
                className="contact-modal__submit"
                type="submit"
                disabled={submitState === 'submitting'}
              >
                {submitState === 'submitting' ? '提交中...' : '提交留言'}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
