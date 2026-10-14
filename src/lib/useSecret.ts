import { useContent } from '../content/ContentContext';
import { useProgress } from '../context/ProgressContext';

/** A página final aparece quando os marcos configurados foram percorridos. */
export function useSecretUnlocked(): boolean {
  const { content } = useContent();
  const { milestones } = useProgress();
  const req = content.secret.requires;
  return req.length > 0 && req.every((m) => milestones.includes(m));
}
