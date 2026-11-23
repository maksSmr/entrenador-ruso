export default function Insignia({ children, tono = 'neutro', className = '' }) {
  return <span className={`insignia insignia--${tono} ${className}`.trim()}>{children}</span>;
}
