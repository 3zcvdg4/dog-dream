export default function ParallaxRolePanel({ brand, role, services }) {
  if (!brand && !role && !services) {
    return null;
  }

  return (
    <div className="parallax-role-panel">
      {brand ? (
        <div className="parallax-role-panel__item">
          <span className="parallax-role-panel__label">品牌</span>
          <strong className="parallax-role-panel__value">{brand}</strong>
        </div>
      ) : null}

      {role ? (
        <div className="parallax-role-panel__item">
          <span className="parallax-role-panel__label">角色</span>
          <strong className="parallax-role-panel__value">{role}</strong>
        </div>
      ) : null}

      {services ? (
        <div className="parallax-role-panel__item">
          <span className="parallax-role-panel__label">负责</span>
          <strong className="parallax-role-panel__value">{services}</strong>
        </div>
      ) : null}
    </div>
  );
}
