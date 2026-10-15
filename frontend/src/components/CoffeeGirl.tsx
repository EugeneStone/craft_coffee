export default function CoffeeGirl() {
  return (
    <svg
      viewBox="0 0 220 220"
      aria-hidden="true"
      focusable="false"
      className="h-auto w-full"
    >
      {/* свитер */}
      <path
        d="M 45 220 Q 50 156 92 144 L 128 144 Q 170 156 175 220 Z"
        fill="var(--color-caramel-700)"
      />
      {/* рука */}
      <path
        d="M 98 162 Q 108 148 124 132"
        stroke="var(--color-caramel-700)"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
      />
      {/* шея */}
      <path d="M 102 116 L 118 114 L 116 148 L 100 148 Z" fill="var(--color-cream-100)" />
      {/* голова в профиль */}
      <path
        d="M 95 60
           Q 116 60 124 76
           Q 126 86 129 96
           Q 132 102 128 104
           Q 125 105 125 107
           Q 127 109 125 111
           Q 123 113 125 115
           Q 123 121 113 122
           Q 100 124 91 120
           Q 73 114 71 94
           Q 69 66 95 60 Z"
        fill="var(--color-cream-100)"
      />
      {/* волосы */}
      <path
        d="M 118 66
           Q 104 70 98 82
           Q 94 92 87 103
           Q 83 110 79 115
           L 73 117
           Q 66 110 66 95
           Q 66 66 92 58
           Q 106 54 118 66 Z"
        fill="var(--color-caramel-500)"
      />
      <circle cx="68" cy="68" r="15" fill="var(--color-caramel-500)" />
      {/* глаз закрыт */}
      <path
        d="M 102 92 Q 106 88 110 92"
        stroke="var(--color-espresso-950)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* румянец */}
      <ellipse
        cx="113"
        cy="101"
        rx="5"
        ry="3"
        fill="var(--color-caramel-200)"
        opacity="0.85"
      />
      {/* чашка у губ (наклон задан атрибутом, глоток анимируется внутри) */}
      <g transform="rotate(12 120 114)">
        <g className="kv-cup">
          <path
            d="M 120 110 L 150 110 L 146 136 Q 132 142 121 136 Z"
            fill="var(--color-cream-50)"
          />
          <path
            d="M 120 110 L 150 110 L 149 117 L 121 117 Z"
            fill="var(--color-caramel-200)"
          />
          <path
            d="M 150 117 Q 158 119 156 125 Q 154 130 147 129"
            stroke="var(--color-cream-50)"
            strokeWidth="4"
            fill="none"
          />
        </g>
      </g>
      {/* рукав и ладонь на чашке */}
      <circle cx="121" cy="137" r="10" fill="var(--color-caramel-700)" />
      <circle cx="126" cy="134" r="7.5" fill="var(--color-cream-100)" />
      {/* пар */}
      <g
        className="kv-steam"
        fill="none"
        stroke="var(--color-cream-200)"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.75"
      >
        <path d="M 142 104 Q 150 96 144 86 Q 139 78 146 68" />
        <path d="M 154 110 Q 162 102 156 92 Q 151 84 158 74" />
        <path d="M 165 118 Q 172 110 167 102" />
      </g>
    </svg>
  );
}
