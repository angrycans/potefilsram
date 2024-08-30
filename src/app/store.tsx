"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { Updater, useImmer } from "use-immer";

export interface StateType {
  count: number; //test
  app: {
    DashboardSidebar: {
      isSidebarExpanded: boolean;
    };
  };
}

// // 定义 context 值接口
export interface StateContextType {
  state: StateType;
  updateState: Updater<StateType>;
}

//const AppID = "";
// 定义状态接口

const defaultState: StateType = {
  count: 0,
  app: {
    DashboardSidebar: {
      isSidebarExpanded: true,
    },
  },
};

// 创建一个 context 对象并导出其 Provider 和 Consumer
const StateContext = createContext<StateContextType | null>(null);

// 创建一个自定义 Provider 组件，它将维护全局状态
export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 使用 useState 创建全局状态
  const [state, updateState] = useImmer(defaultState);

  // Context 的 value 包含了状态和更新状态的函数
  const value = { state, updateState };

  //debug
  //(window as any).store = value;

  // useAsyncEffect(async () => {
  //   //console.log("store useAsyncEffect=>", appID);
  //   // const cols = await getColmDefs();
  //   // console.log("rowdata=>", cols);
  //   // updateGrid((draft) => {
  //   //   draft.ColmDefs = cols;
  //   // });
  // }, []);

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
};

// 创建一个自定义 hook 来访问 context 的值
export const useStore = () => {
  const context = useContext(StateContext);
  if (!context) {
    // 抛出错误，因为 context 不应该在 StateProvider 外部使用
    throw new Error("useStore must be used within a StateProvider");
  }
  return context;
};
