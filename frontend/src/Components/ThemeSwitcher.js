import { useTheme } from '../Context/ThemeContext';

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-switcher">
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="dark">Dark Theme</option>
        <option value="light">Light Theme</option>
        <option value="red">Red Theme</option>
        <option value="green">Green Theme</option>
      </select>
    </div>
  );
}

export default ThemeSwitcher;
