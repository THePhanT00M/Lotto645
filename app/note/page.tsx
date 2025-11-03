"use client"

import { useEffect, useState } from 'react';
// 3단계에서 생성한 클라이언트를 가져옵니다.
import { supabase } from '@/lib/supabaseClient';

function YourComponent() {
  const [myData, setMyData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 'your_table_name'을 실제 Supabase 테이블 이름으로 변경하세요.
        const { data, error } = await supabase
          .from('notes')
          .select('*'); // 모든 컬럼(*)을 선택합니다.

        if (error) {
          throw error;
        }

        if (data) {
          setMyData(data);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Data from Supabase:</h1>
      <pre>{JSON.stringify(myData, null, 2)}</pre>
    </div>
  );
}

export default YourComponent;