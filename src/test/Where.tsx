import { useLocation } from 'react-router-dom'

// Prints the current route so tests can see where a page sent the user.
export default function Where() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}{location.search}</div>
}
