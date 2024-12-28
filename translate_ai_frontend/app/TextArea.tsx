import React from 'react';

const TextArea = () => {
  return (
    <div className='bg-neutral-300 rounded-md text-zinc-900 font-semibold p-5 mb-5'>
      <div className='flex flex-col mb-5'>
        <div className='flex grow bg-white pb-96 rounded'>
          <p className='m-3'>Text Area</p>
        </div>
      </div>
      <div className='flex'>
        <input type='text' placeholder='Enter Text' className='p-1 mr-4' />
        <input type='button' value='Submit' />
      </div>
    </div>
  );
};

export default TextArea;
