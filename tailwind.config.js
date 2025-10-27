module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'atlassian-blue': '#0052CC',
        'atlassian-green': '#36B37E',
        'atlassian-red': '#DE350B',
        'atlassian-yellow': '#FFAB00',
        'atlassian-purple': '#6554C0',
        'atlassian-teal': '#00B8D9',
        'atlassian-orange': '#FF5630',
        'atlassian-neutral': '#42526E',
      },
    },
  },
  plugins: [],
}
