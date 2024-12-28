'use client';
import React from 'react';

const FetchFileButton = () => {
  return (
    <div>
      <input
        type='file'
        onClick={() => console.log('Choose File')}
        // className='rounded-none border-2 border-black'
      />
    </div>
  );
};

export default FetchFileButton;
