### 基础用法

#### 全空间

h-screen h-svh

#### 左右布局 手机屏幕 右边隐藏

##### Solution 1

h-screen h-svh

```
 <div className="h-screen">
      <div className="w-full h-full flex bg-gray">
        <div className="bg-red-500 flex-1  sm:block hidden">Left div</div>
        <div className="bg-blue-500 flex-1 sm:w-full">
         right
        </div>
      </div>
</div>
```

##### Solution 2

默认隐藏 lg:显示

```
   <div className="w-full h-svh lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <div className="mx-auto w-full h-1/2 bg-blue-500">left-div</div>
      <div className="mx-auto w-full h-full bg-red-500 hidden lg:block">right-div</div>
    </div>
```

#### 左右布局 手机屏幕 上下布局

```
  <div className="w-full h-svh lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <div className="mx-auto w-full h-1/2 bg-blue-500 ">left-div</div>
      <div className="mx-auto w-full h-full bg-red-500">right-div 2</div>
    </div>
```
