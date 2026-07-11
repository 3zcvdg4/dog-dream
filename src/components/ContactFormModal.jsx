import { useEffect, useRef, useState } from 'react';

const INITIAL_FORM_STATE = {
  name: '',
  contact: '',
  message: '',
  company: '',
};

const CONTACT_API_ENDPOINT = '/api/contact';
const CONTACT_CONFIG_ENDPOINT = '/api/contact-config';
const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';

const INITIAL_SUBMIT_FEEDBACK = {
  tone: 'idle',
  text: '',
};

let turnstileScriptPromise;

function isValidEmail(value) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function looksLikeEmail(value) {
  return typeof value === 'string' && value.includes('@');
}

function loadTurnstileScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Turnstile unavailable.'));
  }

  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.turnstile), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Turnstile load failed.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error('Turnstile load failed.'));
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

function resolveSubmitError(result, status) {
  switch (result?.errorCode) {
    case 'invalid_email':
      return '邮箱格式不对，请检查后再试。';
    case 'rate_limited':
      return '请求过快，请稍后再试。';
    case 'service_unavailable':
    case 'turnstile_unavailable':
      return '发送服务暂时不可用，请稍后再试。';
    case 'turnstile_required':
    case 'turnstile_failed':
      return '请先完成人机验证后再提交。';
    case 'origin_not_allowed':
      return '当前页面状态已失效，请刷新后再试。';
    default:
      break;
  }

  if (status >= 500) {
    return '发送服务暂时不可用，请稍后再试。';
  }

  return result?.error || '这次没有顺利送达，请稍后再试一次。';
}

function validatePayload(payload) {
  if (!payload.name) return '请先填写称呼。';
  if (!payload.contact) return '请先填写联系方式。';
  if (!payload.message) return '请先填写想说的话。';
  if (looksLikeEmail(payload.contact) && !isValidEmail(payload.contact)) {
    return '邮箱格式不对，请检查后再试。';
  }
  if (payload.name.length > 80) return '称呼请控制在 80 个字符以内。';
  if (payload.contact.length > 120) return '联系方式请控制在 120 个字符以内。';
  if (payload.message.length > 5000) return '留言内容请控制在 5000 个字符以内。';
  return '';
}

export default function ContactFormModal({ open = false, onClose, theme = 'light' }) {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [submitState, setSubmitState] = useState('idle');
  const [submitFeedback, setSubmitFeedback] = useState(INITIAL_SUBMIT_FEEDBACK);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileLoading, setTurnstileLoading] = useState(false);
  const [turnstileError, setTurnstileError] = useState('');
  const [turnstileUnavailable, setTurnstileUnavailable] = useState(false);
  const [turnstilePassed, setTurnstilePassed] = useState(false);
  const turnstileContainerRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);

  function resetTurnstileWidget() {
    setTurnstileToken('');
    setTurnstileUnavailable(false);

    if (!window.turnstile || turnstileWidgetIdRef.current == null) {
      return;
    }

    try {
      window.turnstile.remove(turnstileWidgetIdRef.current);
    } catch {
      // Ignore widget cleanup failures so the modal can still close cleanly.
    }

    turnstileWidgetIdRef.current = null;
  }

  useEffect(() => {
    if (open) return undefined;
    setFormState(INITIAL_FORM_STATE);
    setSubmitState('idle');
    setSubmitFeedback(INITIAL_SUBMIT_FEEDBACK);
    setTurnstileError('');
    setTurnstileLoading(false);
    setTurnstileUnavailable(false);
    setTurnstilePassed(false);
    resetTurnstileWidget();
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;

    async function setupTurnstile() {
      setTurnstileLoading(true);
      setTurnstileError('');
      setTurnstileUnavailable(false);
      setTurnstilePassed(false);
      resetTurnstileWidget();

      try {
        const configResponse = await fetch(CONTACT_CONFIG_ENDPOINT, {
          headers: { Accept: 'application/json' },
        });
        const configResult = await configResponse.json().catch(() => ({}));

        if (!configResponse.ok || !configResult?.turnstileSiteKey) {
          throw new Error(resolveSubmitError(configResult, configResponse.status));
        }

        const turnstile = await loadTurnstileScript();
        if (cancelled || !turnstileContainerRef.current) return;

        turnstileContainerRef.current.innerHTML = '';
        turnstileWidgetIdRef.current = turnstile.render(turnstileContainerRef.current, {
          sitekey: configResult.turnstileSiteKey,
          theme: theme === 'ortur' ? 'dark' : 'light',
          callback: (token) => {
            if (cancelled) return;
            setTurnstileToken(token);
            setTurnstilePassed(true);
            setTurnstileError('');
            setTurnstileLoading(false);
          },
          'expired-callback': () => {
            if (cancelled) return;
            setTurnstileToken('');
            setTurnstilePassed(false);
            setTurnstileError('验证已过期，请重新完成人机验证。');
          },
          'error-callback': () => {
            if (cancelled) return;
            setTurnstileUnavailable(true);
            setTurnstileLoading(false);
            turnstileWidgetIdRef.current = null;
          },
        });
        // 渲染成功后停止 loading，露出验证组件
        setTurnstileLoading(false);
      } catch {
        if (!cancelled) {
          setTurnstileUnavailable(true);
          setTurnstileLoading(false);
          turnstileWidgetIdRef.current = null;
        }
      }
    }

    setupTurnstile();

    return () => {
      cancelled = true;
      if (turnstileWidgetIdRef.current != null && window.turnstile) {
        try { window.turnstile.remove(turnstileWidgetIdRef.current); } catch { /* ignore */ }
      }
      turnstileWidgetIdRef.current = null;
    };
  }, [open, theme]);

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
      company: formState.company,
      name: formState.name.trim(),
      contact: formState.contact.trim(),
      message: formState.message.trim(),
      turnstileToken,
    };

    const validationMessage = validatePayload(payload);
    if (validationMessage) {
      setSubmitState('error');
      setSubmitFeedback({ tone: 'error', text: validationMessage });
      return;
    }

    // 只有在 Turnstile 已加载完成、可用、且用户未通过验证时才拦截
    if (!payload.turnstileToken && !turnstileUnavailable && !turnstileLoading) {
      setSubmitState('error');
      setSubmitFeedback({ tone: 'error', text: '请先完成人机验证后再提交。' });
      return;
    }

    setSubmitState('submitting');
    setSubmitFeedback({ tone: 'progress', text: '正在提交...' });

    try {
      const response = await fetch(CONTACT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resolveSubmitError(result, response.status));
      }

      setFormState(INITIAL_FORM_STATE);
      setTurnstileToken('');
      if (window.turnstile && turnstileWidgetIdRef.current != null) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
      }
      setSubmitState('success');
      setSubmitFeedback({ tone: 'success', text: '已经收到你的留言。' });
    } catch (error) {
      console.error(error);
      setSubmitState('error');
      setSubmitFeedback({
        tone: 'error',
        text: error.message || '这次没有顺利送达，请稍后再试一次。',
      });
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
            <span className="contact-modal__close-icon" aria-hidden="true">×</span>
          </button>
        </header>

        <p className="contact-modal__intro">
          留下称呼、联系方式和想说的话就好。
          我会认真查看每一条留言，并在合适的时候回复你。
        </p>

        <form
          className="contact-modal__form"
          name="contact"
          method="POST"
          onSubmit={handleSubmit}
        >
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
              autoComplete="off"
              placeholder="微信 / 邮箱 / 其他常用联系方式"
              value={formState.contact}
              onChange={handleChange}
              required
            />
          </label>

          <label className="contact-modal__field contact-modal__field--textarea" htmlFor="contact-message">
            <span>想说的话</span>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              placeholder="如果你想聊合作、项目、内容创作，或者只是想打个招呼，都可以写在这里。"
              value={formState.message}
              onChange={handleChange}
              required
            />
          </label>

          {!turnstileUnavailable && !turnstileLoading && (
            <div className="contact-modal__verification">
              {!turnstilePassed && (
                <div className="contact-modal__turnstile" ref={turnstileContainerRef} />
              )}
              <p className="contact-modal__verification-hint" aria-live="polite">
                {turnstilePassed ? '✓ 已通过验证' : (turnstileError || '提交前请先完成人机验证。')}
              </p>
            </div>
          )}

          <div className="contact-modal__footer">
            <div className="contact-modal__status" aria-live="polite">
              {submitFeedback.text}
            </div>

            <div className="contact-modal__actions">
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
