import React from 'react';

const CorrectedText = () => {
  return (
    <div className='bg-neutral-300 rounded-md text-zinc-900 font-semibold p-5'>
      <input
        type='text'
        placeholder='Enter corrected translation'
        className='p-1 mr-4'
      />
      <input type='button' value='Submit' className='hover:text-violet-600' />
    </div>
  );
};

export default CorrectedText;
