// 2020/11/24 タイリングペイントに対応
// 2020/12/20 WINDOW命令に対応
// 2020/12/22 gra をクラスに変更
// 2020/12/23 スキャンライン・シードペイントアルゴリズムに変更

'use strict';

let g_sc = 1.0;	//:1:200line 2:400line
let g_h = 200*g_sc;


class GRA
{
	constructor( context, width, height )
	{
		this.img = context.createImageData( width, height );

		//-----------------------------------------------------------------------------
		this.window = function( x0,y0,x1,y1, x2,y2,x3,y3 )
		//-----------------------------------------------------------------------------
		{
			this.x0 = x0;
			this.y0 = y0;
			this.x1 = x1;
			this.y1 = y1;
			this.x2 = x2;
			this.y2 = y2;
			this.x3 = x3;
			this.y3 = y3;

			this.sw = (this.x1-this.x0+1)/(this.x3-this.x2+1);
			this.sh = (this.y1-this.y0+1)/(this.y3-this.y2+1);
			
			if ( g_sc == 2.0 ) this.sh*=0.99;
		}

		this.window( 
			0,
			0,
			width-1,
			height-1,
			0,
			0,
			width-1,
			height-1
		);

		//-----------------------------------------------------------------------------
		this.window_conv = function( _ox, _oy )
		//-----------------------------------------------------------------------------
		{
			let ox = (_ox-this.x2)*this.sw;	// window対応
			let	oy = (_oy-this.y2)*this.sh;	// window対応
			ox=Math.round(ox);
			oy=Math.round(oy);
			return [ox,oy];
		}
		//-----------------------------------------------------------------------------
		this.window_revconv = function( _ox, _oy )
		//-----------------------------------------------------------------------------
		{
			let ox = _ox/this.sw +this.x2;	// window対応
			let oy = _oy/this.sh +this.y2;	// window対応
			ox=Math.round(ox);
			oy=Math.round(oy);
			return [ox,oy];
		}


		//-----------------------------------------------------------------------------
		this.rgb = function( r,g,b )	// RGB 8:8:8 
		//-----------------------------------------------------------------------------
		{
			return (r<<16)|(g<<8)|b;
		}

		//-----------------------------------------------------------------------------
		this.cls = function( col, a =0xff )
		//-----------------------------------------------------------------------------
		{
			for (let x=0; x<this.img.width ; x++ )
			for (let y=0; y<this.img.height ; y++ )
			{
				let adr = (y*this.img.width+x)*4;
				this.img.data[ adr +0 ] = (col>>16)&0xff;
				this.img.data[ adr +1 ] = (col>> 8)&0xff;
				this.img.data[ adr +2 ] = (col>> 0)&0xff;
				this.img.data[ adr +3 ] = a;
			}
		}
		//-----------------------------------------------------------------------------
		this.pset0 = function( _ox, _oy, col, a=0xff )
		//-----------------------------------------------------------------------------
		{
			let x = Math.floor(_ox);
			let y = Math.floor(_oy);
			if ( x < 0 ) return;
			if ( y < 0 ) return;
			if ( x >= this.img.width ) return;
			if ( y >= this.img.height ) return;

			let adr = (y*this.img.width+x)*4;
			this.img.data[ adr +0 ] = (col>>16)&0xff;
			this.img.data[ adr +1 ] = (col>> 8)&0xff;
			this.img.data[ adr +2 ] = (col>> 0)&0xff;
			this.img.data[ adr +3 ] = a&0xff;
		}
		//-----------------------------------------------------------------------------
		this.pset = function( _px, _py, col )
		//-----------------------------------------------------------------------------
		{
			let [px,py] = this.window_conv( _px, _py );
			this.pset0( px, py, col );
		}
		//-----------------------------------------------------------------------------
		this.line = function( _x1, _y1, _x2, _y2, col ) 
		//-----------------------------------------------------------------------------
		{
			let [x1,y1] = this.window_conv( _x1, _y1 );
			let [x2,y2] = this.window_conv( _x2, _y2 );


			//ブレセンハムの線分発生アルゴリズム

			// 二点間の距離
			let dx = ( x2 > x1 ) ? x2 - x1 : x1 - x2;
			let dy = ( y2 > y1 ) ? y2 - y1 : y1 - y2;

			// 二点の方向
			let sx = ( x2 > x1 ) ? 1 : -1;
			let sy = ( y2 > y1 ) ? 1 : -1;

			if ( dx > dy ) 
			{
				// 傾きが1より小さい場合
				let E = -dx;
				for ( let i = 0 ; i <= dx ; i++ ) 
				{
					this.pset0( x1,y1, col );
					x1 += sx;
					E += 2 * dy;
					if ( E >= 0 ) 
					{
						y1 += sy;
						E -= 2 * dx;
					}
				}
			}
			else
			{
				// 傾きが1以上の場合
				let E = -dy;
				for ( let i = 0 ; i <= dy ; i++ )
				{
					this.pset0( x1, y1, col );
					y1 += sy;
					E += 2 * dx;
					if ( E >= 0 )
					{
						x1 += sx;
						E -= 2 * dy;
					}
				}
			}

		}
		//-----------------------------------------------------------------------------
		this.box = function( x1,y1, x2,y2, col )
		//-----------------------------------------------------------------------------
		{

			this.line( x1,y1,x2,y1, col);
			this.line( x1,y2,x2,y2, col);
			this.line( x1,y1,x1,y2, col);
			this.line( x2,y1,x2,y2, col);
		}

		//-----------------------------------------------------------------------------
		this.circle = function( x,y,r,col, scy=1 )
		//-----------------------------------------------------------------------------
		{
			const scx=2;

			{
				let st = rad(1);
				let x0,y0;
				for (  let i = 0 ; i <= Math.PI*2 ; i+=st  )
				{
					let x1 = r * Math.cos(i)*scx + x;
					let y1 = r * Math.sin(i)*scy + y;

					if ( i > 0 ) this.line( x0, y0, x1, y1, col );
					x0 = x1;
					y0 = y1;
				}
			}
		}

		//-----------------------------------------------------------------------------
		this.point = function( x, y )
		//-----------------------------------------------------------------------------
		{
			let adr = (y*this.img.width+x)*4;
			let r = this.img.data[ adr +0 ];
			let g = this.img.data[ adr +1 ];
			let b = this.img.data[ adr +2 ];
		//	let a = this.img.data[ adr +3 ];
			return this.rgb(r,g,b);
		}

		//-----------------------------------------------------------------------------
		this.paint = function(  _x0, _y0, colsPat, colsRej  ) 
		//-----------------------------------------------------------------------------
		{
			let [x0,y0] = this.window_conv( _x0, _y0 );

			let cntlines = 0;

			{
				let c = this.point(x0,y0);
				if ( colsRej.indexOf(c) != -1 ) return cntlines;
			}

			const MAX = 1000;
			let seed=[];
			seed.push([x0,y0,0,0,0]); // x,y,dir,lx,rx
			while( seed.length > 0 )
			{
				// 先頭のシードを取り出す
				let sx=seed[0][0];
				let sy=seed[0][1];
				let pdir=seed[0][2];
				let plx=seed[0][3];
				let prx=seed[0][4];
				seed.shift();

				// シードから左端を探す
				let lx=sx;
				while( lx > 0 )
				{
					let c = this.point(lx,sy);
					if ( colsRej.indexOf(c) != -1 ) break;
					lx--;
				}
				lx++;

				// シードから右端探す
				let rx=sx;
				while( rx < this.img.width )
				{
					let c = this.point(rx,sy);
					if ( colsRej.indexOf(c) != -1 ) break;
					rx++;
				}
				rx--;

				// 1ライン塗り
				{
					let iy = Math.floor( sy % colsPat.length );
					let ay = sy*this.img.width;
					for ( let x = lx ; x <=rx ; x++ )
					{
						let ix = Math.floor(  x % colsPat[0].length );
						let col = colsPat[iy][ix];
						let adr = (ay+x)*4;
						this.img.data[ adr +0 ] = (col>>16)&0xff;
						this.img.data[ adr +1 ] = (col>> 8)&0xff;
						this.img.data[ adr +2 ] = (col>> 0)&0xff;
						this.img.data[ adr +3 ] = 0xff;
					}
					cntlines++;
				}

				for( let dir of [1, -1] )
				{// 一ライン上（下）のライン内でのペイント領域の右端をすべてシードに加える
					let y=sy+dir;
					if ( dir ==-1 && y < 0 ) continue;
					if ( dir == 1 && y >= this.img.height ) continue;
					let flgBegin = false;
					for ( let x = lx ; x <=rx ; x++ )
					{
						let c = this.point(x,y);
						let s =0;						
						if ( dir != pdir && x >= plx && x <= prx ) s=1; else s=0; // ひとつ前のペイント判定
						if ( flgBegin == false )
						{
							if ( s == 0 && colsRej.indexOf(c) == -1 )
							{
								flgBegin = true;
							}
						}
						else
						{
							if ( s == 0 && colsRej.indexOf(c) == -1 )
							{}
							else
							{
								seed.push([x-1,y,dir,lx,rx]);
								flgBegin = false;
							}
						}
					}
					if ( flgBegin == true )
					{
								seed.push([rx,y,dir,lx,rx]);
					}
				}
			}
			
//console.log("paint2:",seed[0][0],seed[0][1]);			
			return cntlines;
		}
		//-----------------------------------------------------------------------------
		this.paintX = function(  _x0, _y0, colsPat, colsRej  ) 
		//-----------------------------------------------------------------------------
		{
		//	呼び出しサンプル
		//	this.circle(100,100, 20,0xff0000);
		//	this.paint( 100,100, [[0xffff00]],[0xff0000] );

			let [x0,y0] = this.window_conv( _x0, _y0 );

			{// 一ドットも塗る所がなかった場合はfalseを返す
				if ( x0 < 0 || x0 > this.img.width ) return false;
				if ( y0 < 0 || y0 > this.img.height ) return false;
				{
					let c = this.point(x0,y0);
					if ( colsRej.indexOf(c) != -1 ) return false;
				}
			}

			let thisclass = this;

			class Painted
			{
				constructor()
				{
					this.sx = 0;
					this.ex = 0;
					this.y = 0;
				}
			};
			const l_MAXPAINTBUF = 2000;
			let l_cntPaintBuf = 0;
			let painted = new Array(l_MAXPAINTBUF);
			for ( let i = 0 ; i < l_MAXPAINTBUF ; i++ )
			{
				painted[i] = new Painted();
			}

			class Buff
			{
				constructor()
				{
					this.x = 0;
					this.y = 0;
					this.fLower = true;	// false:空き true:壁がある
					this.fUpper = true;	// false:空き true:壁がある
				}
			}
			const l_MAXBUF = 1000;
			let l_cntBuf = 0;
			let l_fPrevLower = false;
			let l_fPrevUpper = false;
			let buff = new Array(l_MAXBUF);
			for ( let i = 0 ; i < l_MAXBUF ; i++ )
			{
				buff[i] = new Buff();
			}


			//-----------------------------------------------------------------------------
			function isPainted( x0, y0 )
			//-----------------------------------------------------------------------------
			{
				for ( let i = 0 ; i < l_cntPaintBuf ; i++ )
				{
					if ( painted[i].y == y0 )
					{
						if ( painted[i].sx <= x0 && x0 <= painted[i].ex )
						{
							return true; //既にペイント済み
						}
					}
				}
				return false;
			}

			//-----------------------------------------------------------------------------
			function addPos( x0, y0, colsRej )
			//-----------------------------------------------------------------------------
			{
				if ( l_cntBuf >= l_MAXBUF ) return;

				let fLower = false;
				let fUpper = false;
				
				if ( y0+1 < thisclass.img.height )
				{
					let c = thisclass.point( x0, y0+1 );
					if ( colsRej.indexOf(c) != -1 )  fLower = true;	// 塗り不可
					if ( isPainted( x0, y0+1 ) ) fLower = true;		// 塗り不可

				}
				else
				{
					fLower = true;									// 塗り不可
				}

				if ( y0-1 >= 0 )
				{
					let c = thisclass.point( x0, y0-1 );
					if ( colsRej.indexOf(c) != -1 )  fUpper = true;	// 塗り不可
					if ( isPainted( x0, y0-1 ) ) fUpper = true;		// 塗り不可
				}
				else
				{
					fUpper = true;									// 塗り不可
				}

				if (( fLower == false && fLower != l_fPrevLower ) 
				||	( fUpper == false && fUpper != l_fPrevUpper ) 
				)	
				{
					buff[l_cntBuf].x = x0;
					buff[l_cntBuf].y = y0;
					buff[l_cntBuf].fLower = fLower;
					buff[l_cntBuf].fUpper = fUpper;

					l_cntBuf++;
				}

				l_fPrevLower = fLower;
				l_fPrevUpper = fUpper;
				

			}

			//-----------------------------------------------------------------------------
			function linepaint( x0, y0, colsPat, colsRej )
			//-----------------------------------------------------------------------------
			{
				if ( isPainted( x0, y0 ) ) return; //既にペイント済み
				if ( l_cntPaintBuf >= l_MAXPAINTBUF ) 
				{
					console.log( "ペイントバッファオーバー");
					return;
				}

				let y = y0;
				l_fPrevLower = true;
				l_fPrevUpper = true;


				// 左端検出
				let x = x0;
				for ( ; x > 0 ; x-- )
				{
					let c = thisclass.point(x-1,y);
					if ( colsRej.indexOf(c) != -1 )  break;	// 左境界検出
				}
				painted[l_cntPaintBuf].sx = x;

				// 右端までペイント
				for ( ; x < thisclass.img.width ; x++ )
				{
					let c = thisclass.point( x, y );
					if ( colsRej.indexOf(c) != -1 )  break;	// 右境界検出
					addPos( x, y, colsRej );

					{
						let ix = Math.floor( x % colsPat[0].length );
						let iy = Math.floor( y % colsPat.length );
						thisclass.pset0( x, y , colsPat[iy][ix] );
					}
				}
				painted[l_cntPaintBuf].ex = x-1;
				painted[l_cntPaintBuf].y = y;
				
				l_cntPaintBuf++;

			}

			{
				l_cntPaintBuf = 0;
				// 最初の一本
				linepaint( x0, y0, colsPat, colsRej );
			}

			{
				let st = 0;
				while( st < l_cntBuf )
				{
					let en = l_cntBuf-1;
//console.log(st,en);
					for ( let i = st ; i <= en ; i++ )
					{
						if ( buff[i].fLower == false )
						{
							linepaint(  buff[i].x, buff[i].y+1, colsPat, colsRej );
						}
						if ( buff[i].fUpper == false )
						{
							linepaint(  buff[i].x, buff[i].y-1, colsPat, colsRej );
						}
					}
					st = en+1;

				}
			}
		//	console.log( "use paint buffer " + l_cntPaintBuf );
			return true;
		}
	}

};

let g_context = html_canvas.getContext('2d');
g_context.imageSmoothingEnabled = g_context.msImageSmoothingEnabled = 0; // スムージングOFF
let gra = new GRA( g_context, 640, g_h );
let g2 = new GRA( g_context, 640, g_h );

let g_tblVectX = 
[
/*660*/ //ラムの髪
/*670*/ 0,91,168,89,160,85,150,83,147,80,139,80,128,82,119,85,111,91,102,97,95,101,93,110,87,116,85,125,83,134,82,147,84,156,86,163,89,167,92,-1,-1,162,95,167,92,172,89,185,87,193,88,195,89,-1,-1,186,91,189,90,195,89,205,91,212,94,222,101,
/*680*/ 219,101,213,104,207,110,205,112,200,115,195,116,204,117,201,119,193,125,186,125,183,124,-1,-1,193,125,189,127,185,128,179,129,169,127,162,123,154,117,150,113,148,110,-1,-1,150,113,142,118,138,121,134,124,127,126,134,118,127,121,
/*690*/ 118,127,111,133,105,141,111,139,104,146,100,151,97,160,101,175,99,186,90,213,88,224,87,211,88,201,79,209,71,214,50,225,45,228,40,233,33,240,28,247,-1,-1,205,112,209,112,215,114,219,118,214,119,219,121,223,126,217,125,225,135,232,
/*700*/ 139,237,140,229,147,220,149,-1,-1,229,147,224,151,220,153,215,154,206,154,199,152,193,149,188,146,183,138,179,129,-1,-1,215,154,216,160,214,171,209,181,205,186,207,179,207,173,204,181,198,187,193,190,187,193,179,200,175,206,-1,-1,
/*710*/ 94,165,91,168,87,171,78,175,75,176,65,180,45,183,34,185,30,185,24,186,9,191,0,195,-14,203,-33,217,-40,225,-1,-1,
/*720*/ 34,185,39,176,41,162,40,150,35,139,29,128,27,117,28,102,32,85,39,69,35,87,33,100,35,116,38,129,43,142,45,146,47,131,54,114,61,102,69,92,78,82,
/*730*/ 92,71,116,56,133,48,177,35,214,23,227,21,242,21,257,20,265,18,273,14,-1,-1,242,21,230,24,216,27,202,33,181,45,154,57,135,63,-1,-1,154,57,179,50,195,49,213,49,227,46,236,42,-1,-1,213,49,202,52,195,52,184,55,173,60,169,63,164,66,-1,
/*740*/ -1,169,63,183,63,200,66,220,71,251,82,297,103,325,113,347,118,357,120,342,121,328,120,308,116,299,113,298,114,310,120,326,124,345,127,360,132,395,146,410,153,432,161,475,181,484,189,460,181,484,197,497,207,506,219,513,233,519,248,
/*750*/ 522,263,522,273,519,286,512,296,492,316,480,325,470,330,480,330,502,322,491,332,474,341,444,350,419,357,426,358,441,355,432,361,406,366,351,370,329,368,-1,-1,40,233,43,239,47,244,54,249,59,251,-1,-1,168,220,171,226,175,235,177,237,188,250,
/*760*/ 199,258,223,268,238,271,242,272,250,273,255,272,265,274,269,275,279,280,283,283,293,291,304,303,296,296,285,292,277,289,299,307,311,320,322,338,326,351,328,361,329,368,330,380,-1,-1,152,232,155,247,156,252,163,273,
/*770*/ 166,281,174,297,192,324,205,340,215,350,230,364,255,380,-1,-1,215,350,207,346,193,337,204,350,182,334,169,326,-1,-1,267,380,250,358,276,372,287,376,295,380,-1,-1,
//];[
/*780*/ //輪郭
/*790*/ 188,146,190,166,190,168,189,170,177,191,176,195,175,206,173,211,172,214,168,220,163,225,156,230,152,232,143,235,133,240,128,241,124,239,120,236,114,231,105,222,102,219,98,216,-1,-1,71,214,62,240,59,251,58,252,57,255,53,267,-1,-1,
/*800*/ 120,236,117,242,116,246,114,254,114,265,118,268,118,269,118,275,134,291,-1,-1,141,300,152,307,163,317,169,326,182,350,184,355,186,357,187,367,191,380,-1,-1,58,250,55,251,28,247,13,245,-10,240,-15,240,-28,242,-40,245,-1,-1,
/*810*/ 83,147,80,147,76,150,71,160,70,168,71,172,75,176,-1,-1,104,380,107,378,111,355,113,352,117,345,127,330,134,325,137,325,143,328,144,330,134,346,131,352,130,355,125,365,122,380,-1,-1,144,330,148,326,152,325,158,327,161,331,161,335,
/*820*/ 159,345,157,350,155,355,144,375,140,380,-1,-1,159,345,166,341,170,340,174,342,175,346,174,356,173,359,168,372,164,380,-1,-1,174,356,181,353,182,353,184,355,-1,-1,187,367,185,380,-1,-1,104,380,100,373,96,370,93,370,89,371,888,888,
//];[
/*830*/ //髪の影
/*840*/ 4,-28,242,-17,226,-2,210,11,201,26,195,56,188,68,185,80,180,89,174,95,169,93,182,89,190,80,199,59,209,40,217,26,228,17,239,13,245,-1,-1,62,240,57,236,52,231,50,225,-1,-1,45,183,48,178,50,170,48,155,53,161,52,153,53,145,58,133,68,117,
/*850*/ 77,106,91,94,102,87,-1,-1,113,81,125,78,140,76,173,77,195,81,234,94,282,117,304,128,317,133,330,137,348,147,328,146,313,147,305,150,301,154,298,159,297,162,-1,-1,303,198,308,205,328,222,348,235,367,241,385,244,402,241,412,235,421,
/*860*/ 225,424,218,425,209,424,200,416,186,412,180,425,186,444,195,462,209,475,222,482,231,487,242,490,257,490,266,487,277,481,287,472,295,465,299,459,300,469,302,479,299,469,308,447,326,436,333,423,338,405,341,422,345,406,350,373,354,339,
/*870*/ 353,326,351,-1,-1,94,157,90,148,88,135,89,122,91,115,93,119,94,112,98,104,105,97,110,94,106,100,104,105,113,97,122,92,133,89,143,90,149,93,151,97,151,99,149,102,136,110,121,117,129,108,120,112,110,120,104,128,98,140,94,152,94,157,
/*880*/ -1,-1,155,106,168,98,181,93,188,93,198,96,209,100,200,105,188,116,181,119,175,119,166,114,155,106,-1,-1,201,119,209,122,215,127,219,134,211,132,216,137,221,140,225,141,221,144,212,146,200,143,192,138,188,134,185,128,-1,-1,
/*890*/ 206,154,206,163,202,171,196,179,187,187,190,177,189,170,-1,-1,163,225,172,243,184,258,194,268,212,279,232,286,253,292,265,299,275,307,262,303,254,303,269,310,286,320,306,343,318,360,326,380,-1,-1,156,230,162,250,169,269,186,299,
/*900*/ 200,318,217,336,223,341,227,343,221,333,216,321,225,331,238,340,284,364,302,373,310,380,-1,-1,192,324,170,310,148,295,-1,-1,140,286,118,269,-1,-1,45,146,44,133,46,116,49,106,54,96,58,91,888,888,
/*910*/ //
/*920*/ 0,101,93,102,87,104,81,106,76,111,79,113,81,116,85,-1,-1,-40,271,-5,286,1,289,39,303,70,317,86,328,90,332,93,337,96,346,97,350,92,364,89,371,83,380,-1,-1,90,332,85,343,70,363,62,373,55,380,-1,-1,92,364,101,368,104,368,107,368,-1,-1,107,357,106,364,107,368,-1,-1,115,339,113,336,111,334,102,330,-1,-1,114,265,114,278,109,303,107,312,-1,-1,118,269,118,275,115,304,114,306,-1,-1,
/*940*/ 113,321,111,334,-1,-1,57,255,32,270,1,289,-1,-1,55,251,29,265,-5,286,-1,-1,18,256,29,265,-1,-1,32,270,61,288,70,293,73,297,78,300,-1,-1,78,291,84,297,94,299,109,303,-1,-1,115,304,117,304,-1,-1,130,307,147,311,-1,-1,
/*950*/ //顔
/*960*/ 142,118,146,120,151,123,151,125,150,126,144,122,138,121,-1,-1,173,141,175,139,179,139,185,143,186,145,179,141,176,141,174,143,173,141,888,888,5,117,141,119,136,121,133,-1,-1,144,138,143,146,141,152,-1,-1,165,163,168,156,-1,-1,
/*970*/ 186,161,184,168,888,888,0,121,133,126,130,131,128,137,129,141,131,143,134,144,138,-1,-1,168,156,173,152,178,151,181,151,184,153,186,156,186,162,-1,-1,115,145,116,143,117,141,120,138,124,135,129,133,133,133,137,135,140,139,141,145,
/*980*/ 141,152,140,153,141,151,139,143,137,139,132,136,127,136,122,138,118,141,115,145,-1,-1,165,163,170,158,176,156,178,155,180,155,183,157,185,162,184,168,183,173,182,163,179,159,172,159,165,163,-1,-1,130,168,124,166,120,164,115,161,
/*990*/ 113,158,-1,-1,164,183,169,185,173,186,176,186,-1,-1,149,173,150,174,154,176,154.5,178,154,180,153,181,149,185,148,187,146,190,-1,-1,143,205,137,203,125,197,119,193,116,190,-1,-1,125,217,128,220,-1,-1,86,328,107,312,114,306,117,304,
/*1000*/ 134,291,140,286,145,281,155,275,-1,-1,93,337,102,330,113,321,130,307,141,300,148,295,153,290,158,287,-1,-1,90,332,157,280,-1,-1,140,153,139.5,155,139,158,137,162,136,164,134,166,132,167,130,167,127,165,126,162,126,160,127,157,128,
/*1010*/ 153,132,149,135,148,138,149,140,151,139.5,155,-1,-1,174,181,172,182,170,182,168,179,168,177,169,175,170,171,173,167,176,165,178,165,180,167,181,170,179,174,177,178,174,181,-1,-1,139.5,155,138,152,135,152,133,153,131,156,130,159,
/*1020*/ 130,162,131,164,133,165,136,164,-1,-1,181,170,178,169,176,169,174,172,172,175,171,177,172,180,174,181,-1,-1,172,175,170,174,169,175,-1,-1,171,177,170,178,168,177,-1,-1,127,157,128,156,129,156,130,159,129,161,127,162,126,160,888,888,
/*1030*/ //顔陰
/*1040*/ 4,150,126,160,134,174,143,178,151,-1,-1,164,183,167,193,167,199,163,209,158,216,150,222,133,230,124,232,120,232,114,231,-1,-1,98,216,98,236,101,252,101,258,99,264,94,273,78,291,-1,-1,153,181,151,181,146,183,143,186,143,188,
//];[
/*1050*/ 145,190,146,190,-1,-1,125,217,123,216,121,218,122,222,126,224,128,224,129,222,128,220,-1,-1,70,317,72,325,72,333,68,345,59,358,44,375,38,380,-1,-1,96,346,99,349,105,351,109,352,111,355,-1,-1,113,352,118,355,121,356,127,355,131,352,
/*1060*/ -1,-1,130,355,135,358,140,358,149,355,157,350,-1,-1,155,355,163,360,168,360,173,359,888,888,0,101,368,100,373,888,888,7,115,145,114,148,113,153,113,158,-1,-1,165,163,164,170,163,177,163,180,164,183,-1,-1,183,173,181,178,178,183,
/*1070*/ 176,186,888,888,0,105,222,116,246,888,888,
//];[
/*1080*/ //テンの輪郭
/*1090*/ 0,216,160,220,162,222,161,231,156,236,150,237,155,235,158,237,158,244,155,255,153,258,153,265,151,269,148,268,152,266,153,270,153,282,154,292,152,292,155,289,160,286,163,292,164,297,162,299,171,296,187,300,184,304,179,304,190,303,
/*1100*/ 198,300,205,296,212,301,210,301,218,298,230,293,240,290,245,286,250,284,252,287,253,289,252,287,256,280,266,273,273,269,275,-1,-1,193,190,190,195,189,201,189,206,-1,-1,198,205,192,209,188,210,185,211,179,209,175,206,-1,-1,172,214,
/*1110*/ 174,218,178,221,181,222,186,222,-1,-1,178,221,171,226,-1,-1,175,235,180,228,184,224,186,222,193,216,195,213,198,205,203,196,206,192,214,187,226,184,233,184,244,197,249,200,252,201,261,203,263,203,266,205,270,210,272,220,273,235,
/*1120*/ 271,244,268,250,261,260,257,268,255,272,-1,-1,261,260,261,262,262,268,265,274,888,888,4,233,170,242,164,254,160,257,160,255,164,266,160,275,159,283,161,279,164,277,170,277,174,279,179,283,180,286,179,290,175,291,181,290,190,289,
/*1130*/ 192,291,193,291,196,289,205,285,213,283,214,282,213,280,208,281,200,280,193,277,195,276,194,274,187,272,186,262,189,260,187,258,187,260,181,258,176,253,173,246,173,247,171,246,170,235,171,233,170,888,888,0,189,206,188,210,-1,-1,
//];[
/*1140*/ //テンの顔
/*1150*/ 189,206,194,201,196,200,197,202,198,205,-1,-1,261,262,265,258,272,255,274,255,277,257,277,261,275,265,270,271,265,274,-1,-1,225,190,227,189,230,189,236,192,239,196,-1,-1,254,206,257,206,261,209,263,212,264,215,-1,-1,222,236,220,
/*1160*/ 235,219,236,219,238,220,242,-1,1,177,237,179,234,185,229,190,227,192,227,200,230,205,234,210,241,212,243,217,248,227,253,233,255,237,257,239,259,240,261,242,268,242,272,-1,-1,190,227,188,232,187,236,187,238,188,240,189,240,199,
/*1170*/ 236,201,236,202,239,210,241,-1,-1,212,243,213,248,215,250,218,250,220,253,228,258,226,265,227,266,230,267,234,265,240,261,666,666,-1,-1,
/*1180*/ 290,245,293,253,296,259,301,265,309,271,318,275,321,279,322,282,321,287,319,290,318,294,315,297,313,298,310,298,306,295,299,288,296,285,289,283,283,283,-1,-1,156,252,145,270,143,275,143,278,145,281,-1,-1,166,281,164,286,163,293,
/*1190*/ 160,295,158,292,157,289,158,287,157,280,155,275,156,267,-1,-1,153,289,158,292,-1,-1,225,218,223,220,-1,-1,237,225,234,227,888,888,4,252,201,254,206,-1,-1,264,215,258,227,-1,-1,237,245,237,257,-1,-1,287,256,293,270,296,285,-1,-1,
/*1200*/ 222,236,224,239,224,243,222,243,220,242,888,888,
//];[
/*1210*/ //雲
/*1220*/ 7,-40,80,-36,81,-34,83,-29,78,-18,73,-9,74,-5,64,4,54,15,49,25,46,30,37,40,30,45,27,48,21,43,10,40,0,-1,-1,-40,156,-37,158,-35,166,-32,170,-26,174,-15,177,-11,177,-6,173,0,178,5,180,16,180,24,177,23,182,24,186,-1,-1,
/*1230*/ 275,0,282,8,285,15,283,27,281,31,277,34,279,38,284,35,288,34,290,35,294,26,301,18,306,15,315,11,327,10,333,11,341,14,343,10,347,7,355,5,363,6,370,9,377,16,379,23,385,24,393,27,404,36,408,42,410,51,416,50,
/*1240*/ 426,51,437,58,446,67,451,80,453,90,452,93,454,94,456,96,463,93,471,92,480,95,487,100,494,112,497,125,497,129,504,126,506,127,510,119,519,112,525,110,530,110,-1,-1,522,273,525,274,530,272,-1,-1,45,27,38,38,37,41,37,49,35,52,17,60,
/*1250*/ 8,67,3,74,1,82,1,87,2,91,-6,94,-8,103,-25,114,-26,119,-33,120,-40,125,-1,-1,306,15,321,15,336,17,355,24,370,34,377,46,380,56,382,65,394,72,402,79,408,87,411,96,411,103,410,109,418,110,431,117,444,128,450,135,454,143,456,154,466,
/*1260*/ 157,475,163,485,173,492,187,497,185,518,185,530,188,999,999,
/*1270*/ // pset
/*1280*/ 0,45,146,24,186,45,183,75,176,78,175,87,17,91,160,103,87,113,81,-28,242,13,245,50,225,62,240,201,119,185,128,297,162,303,198,326,351,163,225,156,230,174,143,150,126,178,151,178,151,164,183,114,231,70,317,96,346,105,351,109,352,
/*1290*/ 111,355,113,352,131,352,130,355,157,350,155,355,173,359,118,269,140,286,148,295,192,324,522,273,432,361,237,257,252,201,258,227,287,256,296,285,237,245,61,239,119,269,191,324,190,323,189,323,106,351,71,318,433,361,434,361,206,154,
/*1300*/ 189,170,189,172,431.5,361,432.5,361,435,361,436,361,153,181,146,190,125,217,128,220,222,236,220,242,254,206,264,215,115,231,116,231,999,999,
/*1310*/ // paint
/*1320*/ 

//髪明部
370, 200, 2,
213, 165, 2,
229, 179, 2,
181, 218, 2,
259, 269, 2,
258, 281, 2,
191, 315, 2,
174, 316, 2,
132, 286, 2,
158, 114, 2,
200, 147, 2,
175, 229, 2,
56, 244, 2,

//髪暗部
275, 141, 5,
385, 284, 5,
71, 154, 5,
61, 224, 5,
132, 255, 5,
166, 299, 5,
26, 205, 5,
205, 294, 5,
105, 115, 5,
178, 112, 5,
199, 131, 5,
197, 162, 5,
268, 179, 5,

//顔
141, 135, 3,
123, 134, 3,
172, 156, 3,
124, 144, 4,
168, 168, 4,
217, 205, 4,
246, 229, 4,
193, 233, 4,
229, 261, 4,
215, 249, 4,
128, 159, 4,
171, 180, 4,
136, 158, 1,
176, 175, 1,
146, 121, 1,
//174, 142, 1,
179, 158, 1,
134, 136, 1,
116, 236, 1,
109, 81, 11,
205, 247, 11,
237, 266, 11,

//肌明部
108, 175, 6,
0, 264, 6,
126, 318, 6,
126, 342, 6,
149, 340, 6,
166, 345, 6,
197, 221, 6,
188, 377, 6,
286, 272, 6,
77, 165, 6,
195, 206, 6,
160, 276, 6,
119, 291, 6,

//肌暗部
179, 373, 7,
170, 133, 7,
186, 149, 7,
262, 253, 7,
310, 281, 7,
106, 285, 7,
154, 372, 7,
138, 370, 7,
116, 370, 7,
93, 376, 7,
264, 262, 7,
185, 205, 7,
172, 220, 7,
145, 188, 7,
125, 222, 7,
221, 239, 7,

//服
13, 278, 4,
111, 300, 4,
108,313,4,
111, 321, 4,
93, 368, 4,
109,328,4,

//バイク
101,361,2,
101,361,10,
78, 340, 2,
78, 340, 8,
80, 370, 9,

//背景
494, 351, 14,
268, 375, 14,
224, 372, 14,
358, 96, 13,
-31, 100, 4,
426, 82, 4,
502, 81, 9,
-11, 57, 9,
-26, 192, 9,
43, 244, 9,
294, 12, 9,
340, 11, 9,


999,999,
/*1410*/ //仕上げ
];[
/*1420*/ 0,104,81,106,82,111,79,-1,-1,102,87,107,86,113,81,-1,-1,87,171,85,166,83,159,80,154,78,154,77,157,-1,-1,85,166,83,166,80,168,79,170,78,175,-1,-1,83,159,80,158,77,161,76,165,76,170,78,175,-1,-1,262,268,268,262,270,261,273,260,-1,
/*1430*/ -1,270,261,269,265,267,269,-1,-1,120,138,117,135,114,130,-1,-1,117,141,113,137,110,132,-1,-1,116,143,112,141,108,137,-1,-1,183,173,187,176,190,176,-1,-1,184,168,186,171,190,172,-1,-1,184,165,188,168,190,168,-1,-1,113,158,112,159,
/*1440*/ -1,-1,115,161,114,162,-1,-1,173,186,174,187,-1,-1,176,186,177,187,999,999

];


function test1()
{
	if ( g_sc == 1.0 ) 
	{
		 g_sc= 2.0;	//:1:200line 2:400line
	}
	else
	{
		 g_sc= 1.0;	//:1:200line 2:400line
	}


	g_h = 200*g_sc;
	gra = new GRA( g_context, 640, g_h );
	g2 = new GRA( g_context, 640, g_h );

	main();
}




//-----------------------------------------------------------------------------
let rad = function( deg )
//-----------------------------------------------------------------------------
{
	return deg*Math.PI/180;
}

//-----------------------------------------------------------------------------
let circle = function( context, x,y,r )
//-----------------------------------------------------------------------------
{
	{
		context.beginPath();
		context.arc(x, y, r, 0, Math.PI * 2, true);
		context.closePath();
		context.stroke();
	}
}

let g_tblCol8 =
[

	0x000000,
	0x0000ff,
	0xff0000,
	0xff00ff,
	0x00ff00,
	0x00ffff,
	0xffff00,
	0xffffff,
]

let g_tblTiling =
{
 0:[[[0x000000]]																	,[0] ],
 1:[[[0x000000]]																	,[0] ],
 2:[[[0x00ff00]]																	,[0,0x00ff00] ],
 3:[[[0x00ffff]]																	,[0,0x00ffff] ],
 4:[[[0xffffff]]																	,[0,0x00ff00,0xffffff] ],
 5:[[[0x00ff00,0x000000],[0x000000,0x00ff00]]										,[0,0x00ff00] ],
 6:[[[0xffffff,0xffff00],[0xffff00,0xffffff]]										,[0,0x00ff00,0xff00ff,0x00ffff,0xffffff] ],
 7:[[[0xffffff,0xff0000,0xffff00,0xff0000],[0xff0000,0xffff00,0xff00ff,0xffff00]]	,[0,0xff0000,0xff00ff,0x00ffff,0xffff00,0xffffff] ],
 8:[[[0x000000,0x0000ff],[0x0000ff,0x000000]]										,[0,0x0000ff] ],
 9:[[[0x0000ff,0x00ffff],[0x00ffff,0x0000ff]]										,[0,0x00ff00,0xffffff] ],
10:[[[0xff00ff,0x00ffff],[0x00ffff,0xff00ff]]										,[0,0x0000ff,0x00ffff,0xffff00,0xffffff] ],
11:[[[0xffff00,0xff0000],[0xff0000,0xffff00]]										,[0] ],
12:[[[0x000000,0x00ff00],[0x00ff00,0x000000]]										,[0] ],
13:[[[0xffffff,0x00ffff],[0x00ffff,0xffffff]]										,[0,0x00ff00,0xffffff] ],
14:[[[0x00ffff,0x0000ff],[0x0000ff,0x00ffff]]										,[0,0xffffff] ],
};

let g_tblPaint=[];
//-----------------------------------------------------------------------------
function drawVector( gra, data )
//-----------------------------------------------------------------------------
{
	let	stat = 0;
	let i = 0;
	let c;
	let sx,sy,ex,ey;

	while( i < data.length )
	{
		switch( stat )
		{

		//------------------------
		case 0: // line color
			c = g_tblCol8[ data[i++] ]; 
			stat = 1;
			continue;
		case 1: // line sx sy
			sx = data[i++];	
			sy = data[i++];	
			stat = 2
			continue;
		case 2: // line ex ey 
			ex = data[i++];	
			ey = data[i++];	
			if ( ex == 888 )	{stat = 0;     continue;}	// end segment & color
			if ( ex == -1 )		{stat = 1;     continue;} 	// end segment
			if ( ex == 999 )	{stat = 3;     continue;}	// end segment & pset mode
			if ( ex == 666 )								// end segment & ten eyes
			{
				gra.circle(217,213*g_sc,7.8,g_tblCol8[0], 2.1*g_sc );	 
				gra.circle(244,231*g_sc,7.8,g_tblCol8[0], 2.1*g_sc );	 
				continue;
			}
			gra.line( sx,sy*g_sc,ex,ey*g_sc, c );
			sx=ex;
			sy=ey;
			continue;

		//------------------------
		case 3: // pset
			c = g_tblCol8[ data[i++] ]; 
			stat = 4;
			continue;
		case 4: // pset put
			ex = data[i++];	
			ey = data[i++];	
			if ( ex == -1 )				{stat = 3;     continue;} 	// end segment & color
			if ( ex == 999 )			{stat = 5;     continue;} 	// end segment & paint mode
			gra.pset( ex,ey*g_sc, c );
			continue;

		//------------------------
		case 5: // PAINT
			ex = data[i++];	
			ey = data[i++];	
//	if ( ex == 999 )			{stat = 9;     continue;} 	// end segment & paint mode
			if ( ex == 999 )			{stat = 6;     continue;} 	// end segment & paint mode
			c = data[i++]; 
			{
				let col = [[884400]];
				let rej = [0,0x00ff00,0xff0000,0xffffff];

				if ( g_tblTiling[c] != undefined )
				{
					col = g_tblTiling[c][0];
					rej = g_tblTiling[c][1];
				}
				if (1) gra.paint( ex,ey*g_sc, col,rej );else   {gra.circle(ex,ey*g_sc, 5,0xff0000,2,2);gra.paint( ex,ey*g_sc, col,[0xff0000] );}
//				if ( c==1 )  {gra.circle(ex,ey*g_sc, 2,0xff0000,2,2*g_sc);gra.paint( ex,ey*g_sc, col,[0xff0000] );}
g_tblPaint.push([ex,ey*g_sc,c]);
			}
			continue;

		//------------------------
		case 6:	// 仕上げ ---
			c = data[i++];
			stat = 7;
			continue;	
		case 7:	// 仕上げ ---
			sx = data[i++];	
			sy = data[i++];	
			ex = data[i++];	
			ey = data[i++];	
			gra.line( sx,sy*g_sc,ex,ey*g_sc, c );
			stat = 8;
			continue;	
		case 8:	// 仕上げ ---
			ex = data[i++];	
			ey = data[i++];	
			if ( ex == -1 )				{stat = 7;     continue;}
			if ( ex == 999 )			{stat = 9;     continue;}
			gra.line( sx,sy*g_sc,ex,ey*g_sc, c );
			sx=ex;
			sy=ey;
			continue;	

		case 9:	// end
			return;
		}
	}
}

//Key
const	KEY_CR	= 13;
const	KEY_0		= 48;
const	KEY_1		= 49;
const	KEY_2		= 50;
const	KEY_3		= 51;
const	KEY_4		= 52;
const	KEY_5		= 53;
const	KEY_6		= 54;
const	KEY_7		= 55;
const	KEY_8		= 56;
const	KEY_9		= 57;
const	KEY_A		= 65;
const	KEY_B		= 66;
const	KEY_C		= 67;
const	KEY_D		= 68;
const	KEY_E		= 69;
const	KEY_F		= 60;
const	KEY_I		= 73;
const	KEY_O		= 79;
const	KEY_Z		= 90;
const	KEY_X		= 88;
const	KEY_LEFT	= 37;
const	KEY_UP		= 38;
const	KEY_RIGHT	= 39;
const	KEY_DOWN	= 40;
let g_idxSample = 0;
let g_idxPal = 2;
//-----------------------------------------------------------------------------
window.onkeydown = function( ev )
//-----------------------------------------------------------------------------
{

	let	c = ev.keyCode;

	let a = g_idxSample;
	if ( c == KEY_LEFT && g_idxSample > 0 ) 
	{
		g_idxSample--;
	}
	if ( c == KEY_RIGHT && g_idxSample < g_tblPaint.length-1 ) 
	{
		g_idxSample++;

		{
			let p = g_tblPaint[g_idxSample];
			gra.paint( p[0],p[1], p[3],p[4] );
			draw_image( gra.img );
		}
	}

	if ( c == KEY_UP )
	{
		let p = g_tblPaint[g_idxSample];
		let col = [[0xaa8822]];
		let rej = [0,0xff0000,0xff00ff,0x00ffff,0xffff00,0xffffff,0x00ff00];
		gra.paint( p[0],p[1], col,rej );
		console.log( p[0],p[1], p[2] );
		draw_image( gra.img );
	}
	if ( c == KEY_DOWN )
	{
		let p = g_tblPaint[g_idxSample];
		let col = [[0x0000ff]];
		let rej = [0,0xff0000,0xff00ff,0x00ffff,0xffff00,0xffffff,0x00ff00];
		gra.paint( p[0],p[1], col,rej );
		draw_image( gra.img );
	}

	if ( c == KEY_X )
	{
		for ( let i = 0 ; i <  g_tblPaint.length ; i++ )
		{
			let p = g_tblPaint[i];
			let col = p[3];
			let rej = p[4];
			let ret = gra.paint( p[0],p[1], col, rej );
		}
			draw_image( gra.img );
	}

	if ( c == KEY_CR )
	{
		{
			let p = g_tblPaint[g_idxSample];
			gra.paint( p[0],p[1], p[3],p[4] );
			draw_image( gra.img );
		}
	}
	if ( c == KEY_I )
	{
		let p = g_tblPaint[g_idxSample];
		g2.circle( p[0],p[1], 2, 0xff0000,4 );
		draw_image( g2.img );
	}
	if ( c == KEY_O )
	{
		let p = g_tblPaint[g_idxSample];
		g2.circle( p[0],p[1], 2, 0xffffff,4 );
		draw_image( g2.img );
	}
	if ( a != g_idxSample )
	{
		console.log( g_idxSample +":"+g_tblPaint[g_idxSample] );
	}

	if ( c == KEY_1 || c == KEY_2 )
	{
		if ( c == KEY_1 ) g_idxPal--;
		if ( c == KEY_2 ) g_idxPal++;
		if ( g_idxPal <= 0 ) g_idxPal = Object.keys(g_tblTiling).length-1;
		if ( g_idxPal >= Object.keys(g_tblTiling).length ) g_idxPal = 0;
		g2.draw_palet();
		draw_image( g2.img );
	}
	if ( c == KEY_Z ) //undo
	{
		
	}
	if ( c == KEY_A )//出力
	{

		for ( let i = 0 ; i < g_tblPaint.length ; i++ )
		{
			console.log( i,g_tblPaint[i] );
		}
	}

}
//-----------------------------------------------------------------------------
g2.draw_palet = function()
//-----------------------------------------------------------------------------
{
		for ( let i = 0 ; i < Object.keys(g_tblTiling).length ; i++ )
		{
			let col = g_tblTiling[i][0];
			let x = i*36;
			let y = 30;//350*g_sc;
			
			let c = 0;
			if ( g_idxPal == i ) c = 0xff0000;
			g2.circle(x,y,8,c,2*g_sc);
			g2.paint(x,y,col,[0,0xff0000,0x888888]);
		}
}

//-----------------------------------------------------------------------------
function draw_image( img )
//-----------------------------------------------------------------------------
{
// 引き伸ばして表示
    let cv=document.createElement('canvas');				// 新たに<canvas>タグを生成
    cv.width=img.width;
    cv.height=img.height;
	cv.getContext("2d").putImageData(img,0,0);				// 作成したcanvasにImageDataをコピー
	{
		let sx = 0;
		let sy = 0;
		let sw = img.width;
		let sh = img.height;
		let dx = 0;
		let dy = 0;
		let dw = 640;
		let dh = 400;
		g_context.drawImage( cv,sx,sy,sw,sh,dx,dy,dw,dh);	// ImageDataは引き延ばせないけど、Imageは引き延ばせる
	}
	
}
//-----------------------------------------------------------------------------
function print( tx, ty, str )
//-----------------------------------------------------------------------------
{
	g_context.font = "12px monospace";
	g_context.fillStyle = "#000000";
	g_context.fillStyle = "#FFFFFF";
	g_context.fillText( str, tx, ty );
}

//-----------------------------------------------------------------------------
function onPaint()
//-----------------------------------------------------------------------------
{
	draw_image( gra.img );
	draw_image( g2.img );

	// テキストは最後に描画
//	print(1,12,"("+ g_mouse_x +"," + g_mouse_y+")" );
//	print(1,32,"("+ g_mouse_x2 +"," + g_mouse_y2/g_sc+")" );
}

let g_mouse_x;
let g_mouse_y;
let g_mouse_x2;
let g_mouse_y2;
let g_mouse_buttons;
//let g_tblcolor = [];
//-----------------------------------------------------------------------------
let mousemove = function( e )
//-----------------------------------------------------------------------------
{
	g_mouse_x = e.offsetX;
	g_mouse_y = e.offsetY;
	g_mouse_buttons = e.buttons;
	let [x,y] = gra.window_revconv( g_mouse_x, g_mouse_y );
	g_mouse_x2 = x;
	g_mouse_y2 = Math.round(y/(2/g_sc));
	if ( g_sc == 1 )g_mouse_y2 +=5;
	requestAnimationFrame( onPaint );
}
//-----------------------------------------------------------------------------
let mousedown = function( e )
//-----------------------------------------------------------------------------
{
	if ( e.buttons==1 )
	{
//		gra.circle(g_mouse_x2,g_mouse_y2, 1, 0xff0000,2*g_sc );
		let cnt = gra.paint(g_mouse_x2,g_mouse_y2, g_tblTiling[g_idxPal][0], [0,0xff0000,0x00ff00,0xff00ff,0xffffff,0x00ffff]);	//画面いっぱいに箱

		if ( cnt )
		{
			g_tblPaint.push( [g_mouse_x2,g_mouse_y2,g_idxPal] );
			console.log( ">",g_tblPaint.length, g_tblPaint[g_tblPaint.length-1] )
		}
		else
		{
			console.log("none");
		}
	}
	requestAnimationFrame( onPaint );
}
//-----------------------------------------------------------------------------
window.onload = function()
//-----------------------------------------------------------------------------
{
	document.onmousedown = mousedown;
	document.onmousemove = mousemove;
	main();
//	requestAnimationFrame( onPaint );

}
//-----------------------------------------------------------------------------
function main()
//-----------------------------------------------------------------------------
{
	gra.window(0,0,639,199, -39,10,529,379);			
	gra.cls( 0x0000ff );			
//	gra.pset( 100,100, 0xff0000 );			
//	gra.circle(245,195,143,0x00ff00,2,1.3 );//画面いっぱいに円
//	gra.box(-39,10,529,379, g_tblCol8[2]);	//画面いっぱいに箱
//	gra.paint(245,195, [[0x880000]], [0xff0000,0x00ff00]);	//ペイント
	drawVector( gra, g_tblVectX );
//	gra.paint(370,170, g_tblTiling[7][0], [0,0xff0000,0x00ff00]);	//画面いっぱいに箱

	{
		g2.window(0,0,639,199, -39,10,529,379);			
		g2.cls( 0x010101, 0 );			
//		g2.draw_palet();
	}
	requestAnimationFrame( onPaint );

}
