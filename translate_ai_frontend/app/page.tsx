import FetchFile from './FetchFile';
import TextArea from './TextArea';
import CorrectedText from './CorrectedText';

export default function Home() {
  return (
    <main className='p-9 bg-neutral-200 rounded-md'>
      <FetchFile />
      <TextArea />
      <CorrectedText/>
    </main>
  );
}
