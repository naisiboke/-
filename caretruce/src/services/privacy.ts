/** A best-effort aid, never a guarantee of anonymity. Always show editable preview. */
export function redact(text: string, names: string[] = []): string {
  let output = text
    .replace(/\d{17}[\dXx]/g, '[证件号码]')
    .replace(/(?:\+86[ -]?)?1[3-9]\d{9}/g, '[电话号码]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[邮箱]')
  for (const name of [...names].filter((n) => n.trim()).sort((a, b) => b.length - a.length))
    output = output.split(name).join('[已隐去]')
  return output
}
