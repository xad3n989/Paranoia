cmake_minimum_required(VERSION 3.15)
project(ParanoiaTorRouter VERSION 2.5.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(WIN32)
    add_executable(paranoia paranoia.cpp)

    target_link_libraries(paranoia PRIVATE
        wininet
        ws2_32
        iphlpapi
        advapi32
        shell32
    )

    if(MSVC)
        target_compile_options(paranoia PRIVATE /W3 /O2 /EHsc /D_CRT_SECURE_NO_WARNINGS)
    else()
        target_compile_options(paranoia PRIVATE -Wall -O3)
        target_link_options(paranoia PRIVATE -static-libgcc -static-libstdc++)
    endif()
else()
    message(FATAL_ERROR "PARANOIA is specifically engineered for the Windows 10/11 Win32 networking stack.")
endif()
