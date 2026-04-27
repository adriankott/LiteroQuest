import { useCallback, useEffect, useState } from 'react';
import {
  getBestScore,
  getProgressForProfile,
  getTotalStars,
  upsertProgress,
} from '../database/queries';
import { Progress } from '../types';

export function useProgress(profileId: number | undefined) {
  const [progressList, setProgressList] = useState<Progress[]>([]);
  const [totalStars, setTotalStars] = useState(0);

  const load = useCallback(async () => {
    if (!profileId) return;
    const [list, stars] = await Promise.all([
      getProgressForProfile(profileId),
      getTotalStars(profileId),
    ]);
    setProgressList(list);
    setTotalStars(stars);
  }, [profileId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProgress = useCallback(
    async (lessonType: string, lessonId: string, stars: number) => {
      if (!profileId) return;
      await upsertProgress(profileId, lessonType, lessonId, stars);
      await load();
    },
    [profileId, load],
  );

  const isLearned = useCallback(
    (lessonId: string) =>
      progressList.some((p) => p.lesson_id === lessonId && p.stars > 0),
    [progressList],
  );

  const getStars = useCallback(
    (lessonId: string) =>
      progressList.find((p) => p.lesson_id === lessonId)?.stars ?? 0,
    [progressList],
  );

  const learnedCount = useCallback(
    (lessonType: string) =>
      progressList.filter((p) => p.lesson_type === lessonType && p.stars > 0)
        .length,
    [progressList],
  );

  const fetchBestScore = useCallback(
    (lessonType: string) => {
      if (!profileId) return Promise.resolve(0);
      return getBestScore(profileId, lessonType);
    },
    [profileId],
  );

  return {
    progressList,
    totalStars,
    load,
    saveProgress,
    isLearned,
    getStars,
    learnedCount,
    fetchBestScore,
  };
}
