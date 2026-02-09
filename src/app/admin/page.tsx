import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">管理ページ</h2>
      <p className="text-sm text-muted-foreground">部員・コースの管理</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>部員管理</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            部員の追加・編集・削除
          </CardContent>
        </Card>

        <Link href="/admin/courses">
          <Card className="hover:border-green-300 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                コース管理
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              コースマスタの管理（ホール別パー・距離設定）
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
