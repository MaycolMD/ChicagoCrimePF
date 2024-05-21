import Image from 'next/image'

const Page = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-gray-600 rounded-lg p-8 w-1318 h-775 mt-50" style={{ width: '1318px', height: '775px', marginTop: '50px' }}>
          <Image
            src='/map.jpeg'
            width={1318}
            height={775}
            alt="Page logo"
            className="mr-4 rounded-lg" 
          />
      </div>
    </div>
  );
};

export default Page;
