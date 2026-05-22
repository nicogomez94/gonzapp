export default function BrandLogo({ variant = 'nav', className = '' }) {
  const classes = ['brand-logo-mark', `brand-logo-mark-${variant}`, className].filter(Boolean).join(' ');
  const src = variant === 'nav' || variant === 'login' ? '/subblanco.svg' : '/consub.svg';

  return (
    <span className={classes}>
      <img src={src} alt="AutoZona" />
    </span>
  );
}
