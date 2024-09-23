import { useMemo } from 'react';
import type { WordListEntry } from 'paratext-bible-word-list';
import { Wordcloud } from '@visx/wordcloud';
import { Text } from '@visx/text';
import { scaleLog } from '@visx/scale';
import ParentSize from '@visx/responsive/lib/components/ParentSize';

type WordCloudProps = {
  wordList: WordListEntry[];
};

export interface CloudData {
  text: string;
  value: number;
}

const colors = ['#858585', '#919191', '#6b6b6b', '#4e4e4e', '#222222', '#000000'];

export default function WordCloud({ wordList }: WordCloudProps) {
  const cloudData = useMemo((): CloudData[] => {
    const sortedWordList = wordList
      .sort((a, b) => {
        if (a.scrRefs.length < b.scrRefs.length) return 1;
        if (a.scrRefs.length > b.scrRefs.length) return -1;
        return 0;
      })
      .slice(0, 150);
    return sortedWordList.map((word) => ({ text: word.word, value: word.scrRefs.length }));
  }, [wordList]);

  const fontScale = scaleLog({
    domain: [
      Math.min(...cloudData.map((w) => w.value)),
      Math.max(...cloudData.map((w) => w.value)),
    ],
    range: [10, 100],
  });
  const fontSizeSetter = (data: CloudData) => fontScale(data.value);

  return (
    <ParentSize style={{ height: '95%' }}>
      {({ width, height }) => (
        <Wordcloud
          height={height}
          rotate={0}
          width={width}
          fontSize={fontSizeSetter}
          font="Impact"
          padding={2}
          spiral="archimedean"
          words={cloudData}
        >
          {(cloudWords) =>
            cloudWords.map((w, i) => (
              <Text
                key={w.text}
                fill={colors[i % colors.length]}
                rotate={0}
                textAnchor="middle"
                transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
                fontSize={w.size}
                fontFamily={w.font}
              >
                {w.text}
              </Text>
            ))
          }
        </Wordcloud>
      )}
    </ParentSize>
  );
}
