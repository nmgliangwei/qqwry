/// <reference types="node" />
import stream from 'stream';
declare namespace Spec {
	interface IpInfo {
		int: number;
		ip: string;
		Country: string;
		Area: string;
	}
	interface IpScopeInfo {
		begInt: number;
		endInt: number;
		begIP: string;
		endIP: string;
		Country: string;
		Area: string;
	}
	interface options {
		/**
		 * 输出数据的格式 支持 'json','csv' 默认 'text'
		 */
		format?: string;
		/**
		 * 是否输出字段名 默认 'false'
		 */
		outHeader?: Boolean;
	}
	class Driver {
		/**
		 * 极速模式
		 */
		speed(): void;
		/**
		 * 关闭极速模式
		 */
		unSpeed(): void;
		/**
		 * 单IP查询
		 * @param {number|string} ip IP地址
		 */
		searchIP(ip: string | number): Spec.IpInfo;
		/**
		 * IP段查询
		 * @param {number|string} bginIP 起始IP
		 * @param {number|string} endIP 结束IP
		 * @param {function} [callback] 回调函数,没有回调函数择执行同步查询
		 */
		searchIPScope(
			bginIP: string | number,
			endIP: string | number,
			callback?: Function
		): Spec.IpScopeInfo[];
		/**
		 * IP段查询 流
		 * @param {number|string} bginIP 起始IP
		 * @param {number|string} endIP 结束IP
		 * @param {object} [options] 输出配制
		 * @param {string} [options.fromat] 输出数据的格式 支持 'json','csv' 默认 'text'
		 * @param {Boolean} [options.outHeader] 是否输出字段名 默认 'false'
		 */
		searchIPScopeStream(
			bginIP: string | number,
			endIP: string | number,
			options?: options
		): stream.Readable;
	}
}

declare const Qqwry: {
	/**
	 * 初始化引擎
	 */
	(): Spec.Driver;
	/**
	 * 初始化引擎
	 */
	new (): Spec.Driver;
	/**
	 * 初始化引擎
	 */
	init(): Spec.Driver;
	/**
	 *
	 * @param speed 开启极速模式
	 * @param dataPath 自定义IP库路径
	 */
	(speed: Boolean, dataPath?: string): Spec.Driver;
	/**
	 *
	 * @param speed 开启极速模式
	 * @param dataPath 自定义IP库路径
	 */
	new (speed: Boolean, dataPath?: string): Spec.Driver;
	/**
	 *
	 * @param speed 开启极速模式
	 * @param dataPath 自定义IP库路径
	 */
	init(speed: Boolean, dataPath?: string): Spec.Driver;
	/**
	 *
	 * @param dataPath 自定义IP库路径
	 * @param speed 开启极速模式
	 */
	(dataPath: string, speed?: Boolean): Spec.Driver;
	/**
	 *
	 * @param dataPath 自定义IP库路径
	 * @param speed 开启极速模式
	 */
	new (dataPath: string, speed?: Boolean): Spec.Driver;
	/**
	 *
	 * @param dataPath 自定义IP库路径
	 * @param speed 开启极速模式
	 */
	init(dataPath: string, speed?: Boolean): Spec.Driver;
	/**
	 * ip地址转数值
	 * @param ip ip地址
	 */
	ipToInt(ip: string | number): number;
	/**
	 * 数值转IP地址
	 * @param int ip数值
	 */
	intToIP(int: number): string;
	/**
	 * 32位 Big Endian 与 Little Endian 数值互转
	 * 适用于一些特殊场景 IP数值读取错误时使用
	 * @param int 32位数值
	 */
	ipEndianChange(int: number): number;
};

export = Qqwry;
