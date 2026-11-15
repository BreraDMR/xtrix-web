import { avatarBackground, initials } from '../utils/avatar'

export default function Avatar({ name, seed, size = 32 }: { name: string; seed?: string | number; size?: number }) {
  return <span aria-hidden="true" className="grid shrink-0 place-items-center rounded-full font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25)]"
    style={{ width: size, height: size, fontSize: Math.round(size * 0.36), background: avatarBackground(seed ?? name) }}>
    {initials(name)}
  </span>
}
