import { allTags, getDays, SUGGESTED_TAGS, type UserTags } from '../data';
import { ACCENT } from '../theme';

interface TagChipsProps {
  idx: number;
  userTags: UserTags;
  onToggleTag: (idx: number, tag: string) => void;
  accent?: string;
}

export default function TagChips({ idx, userTags, onToggleTag, accent = ACCENT }: TagChipsProps) {
  const active = allTags(userTags, idx);
  const auto = getDays()[idx].tags;
  const custom = (userTags[idx] || []).filter((t) => !SUGGESTED_TAGS.includes(t));
  const chips = [...SUGGESTED_TAGS, ...custom];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {chips.map((t) => {
        const on = active.includes(t);
        const isAuto = auto.includes(t);
        return (
          <div
            key={t}
            onClick={() => !isAuto && onToggleTag(idx, t)}
            style={{
              padding: '9px 14px',
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: isAuto ? 'default' : 'pointer',
              transition: 'all .15s',
              ...(on
                ? { background: accent, color: '#141a10', border: `1px solid ${accent}` }
                : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.18)' }),
            }}
          >
            {isAuto ? `${t} ·` : t}
          </div>
        );
      })}
    </div>
  );
}
